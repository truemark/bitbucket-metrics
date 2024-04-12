// Purpose: Register webhooks for all repositories in all workspaces.
import {BitbucketServicesHelper} from './bitbucket-services-helper';
import {Repository, Webhook} from './bitbucket-services-model';
import {BitbucketAuthHelper, ScmData, Workspace} from './bitbucket-auth-helper';
import {MetricsUtilities} from '../metrics-utilities/metrics-utilities';

enum WebhookAction {
  CREATE = 'Create',
  UPDATE = 'Update',
  NONE = 'None',
}
export class BitbucketWebhookRegistrar {
  private static async getWebhook(
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

  private static async determineWebhookAction(
    webhook: Webhook | undefined,
    webhookName: string,
    webhookUrl: string
  ): Promise<WebhookAction> {
    if (!webhook) {
      return WebhookAction.CREATE;
    }
    console.info('Webhook already exists with the same name');
    if (webhook.description === webhookName && webhook.url === webhookUrl) {
      console.info('Webhook already exists with the same name and URL');
      return WebhookAction.NONE;
    } else {
      console.info(
        'Webhook already exists with the same name but different URL'
      );
      return WebhookAction.UPDATE;
    }
  }

  private static async addWebhookToRepository(
    webhookName: string,
    repositoryEvents: string[],
    scmData: ScmData,
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
      scmData.callBackUrl
    );
    if (!repository.name.includes('tau-test')) {
      console.info(
        `Repository ${repository.name} in workspace ${workspace.name} not allowed to register webhooks.`
      );
    } else {
      switch (webhookAction) {
        case WebhookAction.CREATE:
          await BitbucketServicesHelper.createRepositoryWebhook(
            workspace,
            repositorySlug,
            {
              description: webhookName,
              url: scmData.callBackUrl,
              active: true,
              events: repositoryEvents,
              secret: scmData.callBackCode,
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
              url: scmData.callBackUrl,
              active: true,
              events: repositoryEvents,
              secret: scmData.callBackCode,
            }
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
  }

  public static async register(
    webhookName: string,
    repositoryEvents: string[]
  ): Promise<void> {
    const scmSecretManagerName = process.env.SCM_SECRET_MANAGER_NAME
      ? process.env.SCM_SECRET_MANAGER_NAME
      : 'BitbucketScmSecret';
    console.info(`SCM Secret Manager Name: ${scmSecretManagerName}`);

    const scmData = await BitbucketAuthHelper.getScmData(scmSecretManagerName);
    if (!scmData || !scmData.workspaces || scmData.workspaces.length === 0) {
      const errorMassage = 'No workspaces found or workspace values are empty';
      console.error(errorMassage);
      throw new Error(errorMassage);
    }

    console.info(`Workspaces: ${scmData.workspaces.length}`);
    for (const workspace of scmData.workspaces) {
      console.info(`Workspace: ${workspace.name}`);
      const repositories =
        await BitbucketServicesHelper.getRepositories(workspace);

      if (repositories) {
        for (const repository of repositories.values) {
          console.info(
            `Repository UUID: ${repository.uuid} and Name: ${repository.name}`
          );
          await this.addWebhookToRepository(
            webhookName,
            repositoryEvents,
            scmData,
            workspace,
            repository
          );
        }
      } else {
        console.error(
          `No repositories found under the workspace ${workspace.name}`
        );
      }
    }
  }
}
