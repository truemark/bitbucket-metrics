// Purpose: Register webhooks for all repositories in all workspaces.
import {BitbucketServicesHelper} from './bitbucket-services-helper';
import {WebhookRequest} from './bitbucket-services-model';
import {BitbucketAuthHelper, Workspace} from './bitbucket-auth-helper';
import {MetricsUtilities} from '../metrics-utilities/metrics-utilities';

export class BitbucketWebhookRegistrar {
  private static async canAddWebhookToRepository(
    workspace: Workspace,
    repositoryName: string,
    webhookName: string
  ): Promise<boolean> {
    const webhooks = await BitbucketServicesHelper.getRepositoryWebhooks(
      workspace,
      repositoryName
    );

    if (!webhooks || !webhooks.values || webhooks.values.length === 0) {
      return true;
    }

    let isEligible = true;
    for (const webhook of webhooks.values) {
      if (webhook.description === webhookName) {
        console.info('Webhook already exists with the same name');
        isEligible = false;
      }
    }
    return isEligible;
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
    const callBackUrl = scmData.callBackUrl;
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
          const repositorySlug = MetricsUtilities.createRepositorySlug(
            repository.name
          );
          console.info(`Repository Slug: ${repositorySlug}`);
          const canAddWebhookToRepo = await this.canAddWebhookToRepository(
            workspace,
            repositorySlug,
            webhookName
          );
          if (!canAddWebhookToRepo || !repository.name.includes('tau-test')) {
            console.info(
              `Webhook ${webhookName} already exists for repository ${repository.name} in workspace ${workspace.name}`
            );
          } else {
            const webhookRequest: WebhookRequest = {
              description: webhookName,
              url: callBackUrl,
              active: true,
              events: repositoryEvents,
              secret: scmData.callBackCode,
            };
            await BitbucketServicesHelper.createRepositoryWebhook(
              workspace,
              repositorySlug,
              webhookRequest
            );
          }
        }
      } else {
        console.error(
          `No repositories found under the workspace ${workspace.name}`
        );
      }
    }
  }
}
