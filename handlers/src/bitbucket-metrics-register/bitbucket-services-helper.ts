import {Workspace} from './bitbucket-auth-helper';
import {
  RepositoriesResponse,
  RepositoryWebhookResponse,
  WebhookRequest,
  WebhookResponse,
} from './bitbucket-services-model';
import {logger} from '../logging-utils/logger';
import {TimedExponentialBackoff} from '../metrics-utilities/timed-exponential-backoff';

const REMAINING_TIME_HEADER_NAME = 'retry-after-time';

export class BitbucketServicesHelper {
  public static async getRepositoriesPaginated(
    workspace: Workspace,
    scmUrl?: string
  ): Promise<RepositoriesResponse | null> {
    let newScmUrl =
      scmUrl ??
      `https://api.bitbucket.org/2.0/repositories/${encodeURIComponent(
        workspace.name
      )}`;
    if (!newScmUrl.includes('pagelen')) {
      newScmUrl += newScmUrl.includes('?') ? '&pagelen=100' : '?pagelen=100';
    }

    const response = await new TimedExponentialBackoff(
      REMAINING_TIME_HEADER_NAME
    ).makeRequest(newScmUrl, 'GET', {
      Authorization: `Bearer ${workspace.token}`,
      Accept: 'application/json',
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
    const newScmUrl = `https://api.bitbucket.org/2.0/repositories/${encodeURIComponent(
      workspace.name
    )}/${repositorySlug}/hooks`;
    const response = await new TimedExponentialBackoff(
      REMAINING_TIME_HEADER_NAME
    ).makeRequest(
      newScmUrl,
      'POST',
      {
        Authorization: `Bearer ${workspace.token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      webhookRequest
    );

    logger.debug(
      `Webhook Creation Response: ${response.status} ${response.statusText}`
    );
    return response.data as WebhookResponse;
  }

  public static async updateRepositoryWebhook(
    workspace: Workspace,
    repositorySlug: string,
    webhookUuid: string,
    webhookRequest: WebhookRequest
  ): Promise<WebhookResponse | null> {
    const scmUrl = `https://api.bitbucket.org/2.0/repositories/${encodeURIComponent(
      workspace.name
    )}/${repositorySlug}/hooks/${webhookUuid}`;

    const response = await new TimedExponentialBackoff(
      REMAINING_TIME_HEADER_NAME
    ).makeRequest(
      scmUrl,
      'PUT',
      {
        Authorization: `Bearer ${workspace.token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      webhookRequest
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
    const scmUrl = `https://api.bitbucket.org/2.0/repositories/${encodeURIComponent(
      workspace.name
    )}/${repositorySlug}/hooks`;

    const response = await new TimedExponentialBackoff(
      REMAINING_TIME_HEADER_NAME
    ).makeRequest(scmUrl, 'GET', {
      Authorization: `Bearer ${workspace.token}`,
      Accept: 'application/json',
    });

    logger.debug(
      `Repository Webhook Response: ${response.status} ${response.statusText}`
    );
    return response.data as RepositoryWebhookResponse;
  }
}
