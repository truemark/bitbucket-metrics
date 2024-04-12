import axios from 'axios';
import {Workspace} from './bitbucket-auth-helper';
import {
  RepositoriesResponse,
  RepositoryWebhookResponse,
  WebhookRequest,
  WebhookResponse,
} from './bitbucket-services-model';

export class BitbucketServicesHelper {
  private static async getRepositoriesPaginated(
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

  public static async getRepositories(
    workspace: Workspace
  ): Promise<RepositoriesResponse | null> {
    const finalResponse = await this.getRepositoriesPaginated(
      workspace,
      `https://api.bitbucket.org/2.0/repositories/${workspace.name}`
    );
    let tempResponse = finalResponse;
    while (tempResponse?.next) {
      tempResponse = await this.getRepositoriesPaginated(
        workspace,
        tempResponse?.next
      );
      if (tempResponse?.values) {
        finalResponse?.values.push(...tempResponse.values);
      }
    }
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
        `Webhook Response: ${response.status} ${response.statusText}`
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
