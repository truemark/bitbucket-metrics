import axios from 'axios';
import {getAuthToken} from './bitbucket-auth-helper';
import {
  RepositoriesResponse,
  WebhookRequest,
  WebhookResponse,
  WorkspaceResponse,
} from './bitbucket-services-model';

export async function getWorkspacesAsync(): Promise<WorkspaceResponse | null> {
  const accessToken = getAuthToken();
  try {
    const response = await axios.get(
      'https://api.bitbucket.org/2.0/workspaces',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    );
    console.info(
      `Repository Response: ${response.status} ${response.statusText}`
    );
    const workspaceResponse = response.data as WorkspaceResponse;
    console.info(workspaceResponse);
    return workspaceResponse;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function getRepositoriesAsync(
  workspace: string
): Promise<RepositoriesResponse | null> {
  const accessToken = getAuthToken();
  try {
    const response = await axios.get(
      `https://api.bitbucket.org/2.0/repositories/${workspace}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    );
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

export async function createRepositoryWebhookAsync(
  workspace: string,
  repositoryUuid: string,
  webhookRequest: WebhookRequest
): Promise<WebhookResponse | null> {
  const accessToken = getAuthToken();
  try {
    const response = await axios.post(
      `https://api.bitbucket.org/2.0/repositories/${workspace}/${repositoryUuid}/hooks`,
      webhookRequest,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
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
