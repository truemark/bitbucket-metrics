import axios, {AxiosError, isAxiosError} from 'axios';
import {Workspace} from './bitbucket-auth-helper';
import {
  RepositoriesResponse,
  RepositoryWebhookResponse,
  WebhookRequest,
  WebhookResponse,
} from './bitbucket-services-model';
import {logger} from '../logging-utils/logger';

export class BitbucketServicesHelper {
  public static async getRepositoriesPaginated(
    workspace: Workspace,
    scmUrl?: string
  ): Promise<RepositoriesResponse | null> {
    // TODO add query parameter pagelen to get more than 10 repositories at a time and reduce API calls
    // TODO Need to handle 429 errors and do a backoff strategy
    const newScmUrl =
      scmUrl ??
      `https://api.bitbucket.org/2.0/repositories/${encodeURIComponent(
        workspace.name
      )}`;
    const response = await axios.get(newScmUrl, {
      headers: {
        Authorization: `Bearer ${workspace.token}`,
        Accept: 'application/json',
      },
    });
    logger.debug(
      `Repository Response: ${response.status} ${response.statusText}`
    );
    return response.data as RepositoriesResponse;
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
    // TODO Need to handle 429 errors and do a backoff strategy
    for (let i = 0; i < 3; i++) {
      try {
        const response = await axios.post(
          `https://api.bitbucket.org/2.0/repositories/${encodeURIComponent(
            workspace.name
          )}/${repositorySlug}/hooks`,
          webhookRequest,
          {
            headers: {
              Authorization: `Bearer ${workspace.token}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          }
        );
        logger.debug(
          `Webhook Creation Response: ${response.status} ${response.statusText}`
        );
        return response.data as WebhookResponse;
      } catch (e) {
        if (isAxiosError(e)) {
          const ae = e as AxiosError;
          if (ae.status === 429) {
            logger.warn(
              'Rate limited while creating webhook, retrying in 5 seconds'
            );
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        } else {
          throw e;
        }
      }
    }
    throw new Error('Retries exhausted, failed to create webhook');
  }

  public static async updateRepositoryWebhook(
    workspace: Workspace,
    repositorySlug: string,
    webhookUuid: string,
    webhookRequest: WebhookRequest
  ): Promise<WebhookResponse | null> {
    // TODO Need to handle 429 errors and do a backoff strategy
    const response = await axios.put(
      `https://api.bitbucket.org/2.0/repositories/${encodeURIComponent(
        workspace.name
      )}/${repositorySlug}/hooks/${webhookUuid}`,
      webhookRequest,
      {
        headers: {
          Authorization: `Bearer ${workspace.token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );
    logger.debug(
      `Webhook Update Response: ${response.status} ${response.statusText}`
    );
    return response.data as WebhookResponse;
  }

  public static async getRepositoryWebhooks(
    workspace: Workspace,
    repositorySlug: string
  ): Promise<RepositoryWebhookResponse | null> {
    // TODO Need to handle 429 errors and do a backoff strategy
    for (let i = 0; i < 3; i++) {
      try {
        const response = await axios.get(
          `https://api.bitbucket.org/2.0/repositories/${encodeURIComponent(
            workspace.name
          )}/${repositorySlug}/hooks`,
          {
            headers: {
              Authorization: `Bearer ${workspace.token}`,
              Accept: 'application/json',
            },
          }
        );
        logger.debug(
          `Repository Webhook Response: ${response.status} ${response.statusText}`
        );
        return response.data as RepositoryWebhookResponse;
      } catch (e) {
        if (isAxiosError(e)) {
          const ae = e as AxiosError;
          if (ae.status === 429) {
            logger.warn(
              'Rate limited while getting webhooks, retrying in 5 seconds'
            );
            await new Promise(resolve => setTimeout(resolve, 10000));
          }
        } else {
          throw e;
        }
      }
    }
    throw new Error('Retries exhausted, failed to create webhook');
  }
}
