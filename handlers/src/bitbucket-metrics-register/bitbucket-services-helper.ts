import axios from 'axios';
import {Workspace} from './bitbucket-auth-helper';
import {
  RepositoriesResponse,
  RepositoryWebhookResponse,
  WebhookRequest,
  WebhookResponse,
} from './bitbucket-services-model';

export class BitbucketServicesHelper {
  public static async getRepositoriesPaginated(
    workspace: Workspace,
    scmUrl?: string
  ): Promise<RepositoriesResponse | null> {
    const newScmUrl =
      scmUrl ?? `https://api.bitbucket.org/2.0/repositories/${workspace.name}`;
    try {
      const response = await axios.get(newScmUrl, {
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

  public static async getRepositories(
    workspace: Workspace
  ): Promise<RepositoriesResponse | null> {
    let tempResponse: RepositoriesResponse | null = null;
    let finalResponse: RepositoriesResponse | null = null;

    do {
      let nextScmUrl: string | undefined;
      if (!tempResponse) {
        nextScmUrl = undefined;
      } else {
        nextScmUrl = tempResponse?.next;
      }
      tempResponse = await this.getRepositoriesPaginated(workspace, nextScmUrl);
      if (!finalResponse) {
        finalResponse = tempResponse;
      } else if (tempResponse?.values) {
        finalResponse.values.push(...tempResponse.values);
      }
    } while (tempResponse?.next);

    return finalResponse;
  }

  public static async createRepositoryWebhook(
    workspace: Workspace,
    repositorySlug: string,
    webhookRequest: WebhookRequest
  ): Promise<WebhookResponse | null> {
    try {
      const response = await axios.post(
        `https://api.bitbucket.org/2.0/repositories/${workspace.name}/${repositorySlug}/hooks`,
        webhookRequest,
        {
          headers: {
            Authorization: `Bearer ${workspace.token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );
      console.info(
        `Webhook Creation Response: ${response.status} ${response.statusText}`
      );
      const webhookResponse = response.data as WebhookResponse;
      console.info(webhookResponse);
      return webhookResponse;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  public static async updateRepositoryWebhook(
    workspace: Workspace,
    repositorySlug: string,
    webhookUuid: string,
    webhookRequest: WebhookRequest
  ): Promise<WebhookResponse | null> {
    try {
      const response = await axios.put(
        `https://api.bitbucket.org/2.0/repositories/${workspace.name}/${repositorySlug}/hooks/${webhookUuid}`,
        webhookRequest,
        {
          headers: {
            Authorization: `Bearer ${workspace.token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );
      console.info(
        `Webhook Update Response: ${response.status} ${response.statusText}`
      );
      const webhookResponse = response.data as WebhookResponse;
      console.info(webhookResponse);
      return webhookResponse;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  public static async getRepositoryWebhooks(
    workspace: Workspace,
    repositorySlug: string
  ): Promise<RepositoryWebhookResponse | null> {
    try {
      const response = await axios.get(
        `https://api.bitbucket.org/2.0/repositories/${workspace.name}/${repositorySlug}/hooks`,
        {
          headers: {
            Authorization: `Bearer ${workspace.token}`,
            Accept: 'application/json',
          },
        }
      );
      console.info(
        `Repository Webhook Response: ${response.status} ${response.statusText}`
      );
      const webhookResponse = response.data as RepositoryWebhookResponse;
      console.info(webhookResponse);
      return webhookResponse;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}
