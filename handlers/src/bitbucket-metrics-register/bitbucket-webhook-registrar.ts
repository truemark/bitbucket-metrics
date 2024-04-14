// Purpose: Register webhooks for all repositories in all workspaces.
import {BitbucketServicesHelper} from './bitbucket-services-helper';
import {
  RepositoriesResponse,
  Repository,
  Webhook,
} from './bitbucket-services-model';
import {BitbucketAuthHelper, ScmData, Workspace} from './bitbucket-auth-helper';
import {MetricsUtilities} from '../metrics-utilities/metrics-utilities';

enum WebhookAction {
  CREATE = 'Create',
  UPDATE = 'Update',
  NONE = 'None',
  NOT_ALLOWED = 'Not Allowed',
}

const scmSecretManagerName = process.env.SCM_SECRET_MANAGER_NAME
  ? process.env.SCM_SECRET_MANAGER_NAME
  : 'BitbucketScmSecret';

export class BitbucketWebhookRegistrar {
  scmData: ScmData | null = null;
  allowListedRepositories: string[] = [];

  private constructor() {}

  private async initialize(): Promise<void> {
    this.scmData = await BitbucketAuthHelper.getScmData(scmSecretManagerName);
    if (this.scmData?.repositories) {
      this.allowListedRepositories = this.scmData.repositories.map(item =>
        item.toLowerCase()
      );
    }
    if (this.allowListedRepositories.length === 0) {
      throw new Error(
        'No repositories are allowed to register webhooks. Please update the SCM secret.'
      );
    }
  }

  public static async create(): Promise<BitbucketWebhookRegistrar> {
    const registrar = new BitbucketWebhookRegistrar();
    await registrar.initialize();
    return registrar;
  }

  private async getWebhook(
    workspace: Workspace,
    repositoryName: string,
    webhookName: string
  ): Promise<Webhook | undefined> {
    const webhooks = await BitbucketServicesHelper.getRepositoryWebhooks(
      workspace,
      repositoryName
    );

    if (!webhooks || !webhooks.values || webhooks.values.length === 0) {
      return undefined;
    }

    for (const webhook of webhooks.values) {
      if (webhook.description === webhookName) {
        return webhook;
      }
    }
    return undefined;
  }

  private async determineWebhookAction(
    webhook: Webhook | undefined,
    webhookName: string,
    repositorySlug: string
  ): Promise<WebhookAction> {
    const isRepositoryAllowListed =
      this.allowListedRepositories.length > 0 &&
      (this.allowListedRepositories.includes('all') ||
        this.allowListedRepositories.includes(repositorySlug));
    if (!isRepositoryAllowListed) {
      return WebhookAction.NOT_ALLOWED;
    }
    if (!webhook) {
      return WebhookAction.CREATE;
    }
    console.info('Webhook already exists with the same name');
    if (
      webhook.description === webhookName &&
      webhook.url === this.scmData!.callBackUrl
    ) {
      console.info('Webhook already exists with the same name and URL');
      return WebhookAction.NONE;
    } else {
      return WebhookAction.UPDATE;
    }
  }

  private async addWebhookToRepository(
    webhookName: string,
    repositoryEvents: string[],
    workspace: Workspace,
    repository: Repository
  ): Promise<void> {
    const repositorySlug = MetricsUtilities.createRepositorySlug(
      repository.name
    );
    console.info(`Repository Slug: ${repositorySlug}`);

    const webhook = await this.getWebhook(
      workspace,
      repositorySlug,
      webhookName
    );

    const webhookAction = await this.determineWebhookAction(
      webhook,
      webhookName,
      repositorySlug
    );

    switch (webhookAction) {
      case WebhookAction.CREATE:
        await BitbucketServicesHelper.createRepositoryWebhook(
          workspace,
          repositorySlug,
          {
            description: webhookName,
            url: this.scmData!.callBackUrl,
            active: true,
            events: repositoryEvents,
            secret: this.scmData!.callBackCode,
          }
        );
        break;
      case WebhookAction.UPDATE:
        await BitbucketServicesHelper.updateRepositoryWebhook(
          workspace,
          repositorySlug,
          webhook!.uuid!,
          {
            description: webhookName,
            url: this.scmData!.callBackUrl,
            active: true,
            events: repositoryEvents,
            secret: this.scmData!.callBackCode,
          }
        );
        break;
      case WebhookAction.NOT_ALLOWED:
        console.info(
          `Repository ${repository.name} in workspace ${workspace.name} not allowed to register webhooks.`
        );
        break;
      case WebhookAction.NONE:
        console.info(
          `Webhook ${webhookName} already exists for repository ${repository.name} in workspace ${workspace.name}`
        );
        break;
      default:
        console.log('Invalid webhook action');
        break;
    }
  }

  private async registerRepositories(
    webhookName: string,
    repositoryEvents: string[],
    workspace: Workspace,
    nextScmUrl: string | undefined
  ): Promise<RepositoriesResponse | null> {
    const repositoryResponse: RepositoriesResponse | null =
      await BitbucketServicesHelper.getRepositoriesPaginated(
        workspace,
        nextScmUrl
      );
    if (repositoryResponse) {
      for (const repository of repositoryResponse.values) {
        console.info(
          `Repository UUID: ${repository.uuid} and Name: ${repository.name}`
        );
        await this.addWebhookToRepository(
          webhookName,
          repositoryEvents,
          workspace,
          repository
        );
      }
    } else {
      console.error(
        `No repositories found under the workspace ${workspace.name}`
      );
    }
    return repositoryResponse;
  }

  public async register(
    webhookName: string,
    repositoryEvents: string[]
  ): Promise<void> {
    console.info(`SCM Secret Manager Name: ${scmSecretManagerName}`);

    if (
      !this.scmData ||
      !this.scmData.workspaces ||
      this.scmData.workspaces.length === 0
    ) {
      const errorMassage = 'No workspaces found or workspace values are empty';
      console.error(errorMassage);
      throw new Error(errorMassage);
    }

    console.info(`Workspaces: ${this.scmData.workspaces.length}`);
    for (const workspace of this.scmData.workspaces) {
      console.info(`Workspace: ${workspace.name}`);
      let repositoryResponse: RepositoriesResponse | null = null;
      let count = 0;
      do {
        let nextScmUrl: string | undefined;
        if (!repositoryResponse) {
          nextScmUrl = undefined;
        } else {
          nextScmUrl = repositoryResponse?.next;
        }
        repositoryResponse = await this.registerRepositories(
          webhookName,
          repositoryEvents,
          workspace,
          nextScmUrl
        );
        count++;
        console.info(
          `Received ${repositoryResponse?.pagelen} repositories on page ${count}`
        );
      } while (repositoryResponse?.next);
    }
  }
}
