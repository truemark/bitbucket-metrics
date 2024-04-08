import axios from 'axios';
import {Workspace} from './bitbucket-auth-helper';
import {
  RepositoriesResponse,
  WebhookRequest,
  WebhookResponse,
} from './bitbucket-services-model';

async function getRepositories(
  workspace: Workspace,
  scmUrl: string
): Promise<RepositoriesResponse | null> {
  try {
    const response = await axios.get(scmUrl, {
      headers: {
        Authorization: `Bearer ${workspace.token}`,
        Accept: 'application/json',
      },
    });
    console.info(
      `Repository Response: ${response.status} ${response.statusText}`
    );
    const repositoriesResponse = response.data as RepositoriesResponse;
    console.info(repositoriesResponse);
    return repositoriesResponse;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function getRepositoriesAsync(
  workspace: Workspace
): Promise<RepositoriesResponse | null> {
  const finalResponse = await getRepositories(
    workspace,
    `https://api.bitbucket.org/2.0/repositories/${workspace.name}`
  );
  let tempResponse = finalResponse;
  while (tempResponse?.next) {
    tempResponse = await getRepositories(workspace, tempResponse?.next);
    if (tempResponse?.values) {
      finalResponse?.values.push(...tempResponse.values);
    }
  }
  return finalResponse;
}
export async function createRepositoryWebhookAsync(
  workspace: Workspace,
  repositoryUuid: string,
  webhookRequest: WebhookRequest
): Promise<WebhookResponse | null> {
  try {
    const response = await axios.post(
      `https://api.bitbucket.org/2.0/repositories/${workspace.name}/${repositoryUuid}/hooks`,
      webhookRequest,
      {
        headers: {
          Authorization: `Bearer ${workspace.token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );
    console.info(`Webhook Response: ${response.status} ${response.statusText}`);
    const webhookResponse = response.data as WebhookResponse;
    console.info(webhookResponse);
    return webhookResponse;
  } catch (err) {
    console.error(err);
    throw err;
  }
}
