// Purpose: Register webhooks for all repositories in all workspaces.
import {
  createRepositoryWebhookAsync,
  getRepositoriesAsync,
  getWorkspacesAsync,
} from './bitbucket-services-helper';
import {WebhookRequest} from './bitbucket-services-model';

export async function registerRepositoryWebhooks(
  webhookName: string,
  callBackUrl: string,
  repositoryEvents: string[]
): Promise<void> {
  const workspaces = await getWorkspacesAsync();
  if (!workspaces || !workspaces.values || workspaces.values.length === 0) {
    const errorMassage = 'No workspaces found or workspace values are empty';
    console.error(errorMassage);
    throw new Error(errorMassage);
  }
  console.info(`Workspaces: ${workspaces.values}`);
  for (const workspace of workspaces.values) {
    console.info(`Workspace: ${workspace.uuid}`);
    const repositories = await getRepositoriesAsync(workspace.uuid);
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
            secret: '', // TODO: Add a secret here after preliminary testing
          };
          await createRepositoryWebhookAsync(
            workspace.uuid,
            repository.uuid,
            webhookRequest
          );
        }
      }
    } else {
      console.error(
        `No repositories found under the workspace ${workspace.uuid}`
      );
    }
  }
}
