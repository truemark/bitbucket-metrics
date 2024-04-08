// Purpose: Register webhooks for all repositories in all workspaces.
import {
  createRepositoryWebhookAsync,
  getRepositoriesAsync,
} from './bitbucket-services-helper';
import {WebhookRequest} from './bitbucket-services-model';
import {getScmData} from './bitbucket-auth-helper';

export async function registerRepositoryWebhooks(
  webhookName: string,
  callBackUrl: string,
  repositoryEvents: string[]
): Promise<void> {
  const scmSecretManagerName = process.env.SCM_SECRET_MANAGER_NAME!;
  console.info(`SCM Secret Manager Name: ${scmSecretManagerName}`);
  const scmData = await getScmData(scmSecretManagerName);
  if (!scmData || !scmData.workspaces || scmData.workspaces.length === 0) {
    const errorMassage = 'No workspaces found or workspace values are empty';
    console.error(errorMassage);
    throw new Error(errorMassage);
  }
  console.info(`Workspaces: ${scmData.workspaces}`);
  for (const workspace of scmData.workspaces) {
    console.info(`Workspace: ${workspace.name}`);
    const repositories = await getRepositoriesAsync(workspace);
    if (repositories) {
      for (const repository of repositories.values) {
        console.info(`Repository: ${repository.uuid}`);
        if (repository!.links!.hooks!.name === webhookName) {
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
          await createRepositoryWebhookAsync(
            workspace,
            repository.uuid,
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
