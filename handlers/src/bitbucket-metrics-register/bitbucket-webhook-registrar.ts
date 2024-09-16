// Purpose: Register webhooks for all repositories in all workspaces.
import {BitbucketServicesHelper} from './bitbucket-services-helper';
import {
  RepositoriesResponse,
  Repository,
  Webhook,
} from './bitbucket-services-model';
import {BitbucketAuthHelper, ScmData, Workspace} from './bitbucket-auth-helper';
import {MetricsUtilities} from '../metrics-utilities/metrics-utilities';
import {RepositoryTrackerService} from './repository-tracker';
import * as logging from '@nr1e/logging';

const log = logging.getLogger('bitbucket-webhook-registrar');

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
  readonly repositoryTrackerService: RepositoryTrackerService;

  private constructor() {
    this.repositoryTrackerService = new RepositoryTrackerService();
  }

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
    log.debug().msg('Webhook already exists with the same name');
    if (
      webhook.description === webhookName &&
      webhook.url === this.scmData!.callBackUrl
    ) {
      log.debug().msg('Webhook already exists with the same name and URL');
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
      repository.slug
    );
    log.debug().str('slug', repositorySlug).msg('Repository Slug');

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
        log
          .info()
          .str('webhookName', webhookName)
          .str('repository', repository.name)
          .str('workspace', workspace.name)
          .msg('Webhook created');
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
        log
          .info()
          .str('webhookName', webhookName)
          .str('repository', repository.name)
          .str('workspace', workspace.name)
          .msg('Webhook updated');
        break;
      case WebhookAction.NOT_ALLOWED:
        log
          .debug()
          .str('repository', repository.name)
          .str('workspace', workspace.name)
          .msg('Repository not allowed to register webhooks');
        break;
      case WebhookAction.NONE:
        log
          .debug()
          .str('webhookName', webhookName)
          .str('repository', repository.name)
          .str('workspace', workspace.name)
          .msg('Webhook already exists for repository');
        break;
      default:
        log.warn().msg('Invalid webhook action');
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
        await this.addWebhookToRepository(
          webhookName,
          repositoryEvents,
          workspace,
          repository
        );
      }
    } else {
      log.warn().str('workspace', workspace.name).msg('No repositories found');
    }
    return repositoryResponse;
  }

  public async register(
    webhookName: string,
    repositoryEvents: string[]
  ): Promise<void> {
    log.info().msg('About to register repository webhooks');
    if (
      !this.scmData ||
      !this.scmData.workspaces ||
      this.scmData.workspaces.length === 0
    ) {
      const errorMassage = 'No workspaces found or workspace values are empty';
      log.error().msg(errorMassage);
      throw new Error(errorMassage);
    }

    log
      .info()
      .num('count', this.scmData.workspaces.length)
      .msg('Available workspaces');
    for (const workspace of this.scmData.workspaces) {
      log.debug().str('Workspace', workspace.name).msg('Workspace');
      let repositoryResponse: RepositoriesResponse | null = null;
      let count = 0;
      do {
        let nextScmUrl: string | undefined;
        if (!repositoryResponse) {
          const trackerItem = await this.repositoryTrackerService.getTracker(
            workspace.name
          );
          nextScmUrl =
            trackerItem?.nextUrl === 'NONE' ? undefined : trackerItem?.nextUrl;
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
        log
          .info()
          .num('count', count)
          .unknown('pageLen', repositoryResponse?.pagelen)
          .msg('Received repositories');
        await this.repositoryTrackerService.saveTracker({
          workspaceName: workspace.name,
          nextUrl: repositoryResponse?.next ?? 'NONE',
        });
      } while (repositoryResponse?.next);
    }
    log.error().msg('Repository webhooks registration completed');
  }
}
