import {expect, describe, Mocked, vi, beforeEach, it, beforeAll} from 'vitest';
import axios from 'axios';
import {BitbucketServicesHelper} from './bitbucket-services-helper';
import {
  WebhookRequest,
  WebhookResponse,
  RepositoryWebhookResponse,
} from './bitbucket-services-model';
import * as logging from '@nr1e/logging';

beforeAll(async () => {
  await logging.initialize({
    svc: 'bitbucket-service-helper.test',
    level: 'trace',
  });
});

vi.mock('axios');
const mockedAxios = axios as Mocked<typeof axios>;

describe('bitbucket-services-helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('BitbucketServicesHelper.getRepositories', () => {
    it('should return all repositories across multiple pages', async () => {
      const workspace = {name: 'workspace1', token: 'token1'};
      const repositoriesResponse1 = {
        values: ['repo1', 'repo2'],
        next: 'next_url',
      };
      const repositoriesResponse2 = {values: ['repo3', 'repo4']};

      mockedAxios.get
        .mockResolvedValueOnce({data: repositoriesResponse1})
        .mockResolvedValueOnce({data: repositoriesResponse2});

      const result = await BitbucketServicesHelper.getRepositories(workspace);

      expect(result).toEqual({
        next: 'next_url',
        values: ['repo1', 'repo2', 'repo3', 'repo4'],
      });
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should return repositories from a single page', async () => {
      const workspace = {name: 'workspace1', token: 'token1'};
      const repositoriesResponse = {values: ['repo1', 'repo2']};

      mockedAxios.get.mockResolvedValueOnce({data: repositoriesResponse});

      const result = await BitbucketServicesHelper.getRepositories(workspace);

      expect(result).toEqual(repositoriesResponse);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should throw an error when the axios call fails', async () => {
      const workspace = {name: 'workspace1', token: 'token1'};

      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        BitbucketServicesHelper.getRepositories(workspace)
      ).rejects.toThrow('Network error');
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('createRepositoryWebhook', () => {
    it('should return the webhook response when the axios call is successful', async () => {
      const workspace = {name: 'workspace1', token: 'token1'};
      const webhookResponse: WebhookResponse = {
        type: '<string>',
        uuid: '<string>',
        url: '<string>',
        description: '<string>',
        subject_type: 'repository',
        active: true,
        created_at: '<string>',
        events: ['issue:comment_created'],
        secret_set: true,
        secret: '<string>',
      };
      const mockResponse = {
        data: webhookResponse,
        status: 201,
        statusText: 'Created',
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const webhookRequest: WebhookRequest = {
        description: 'Webhook Description',
        url: 'https://example.com/',
        active: true,
        secret: 'this is a really bad secret',
        events: ['repo:push', 'issue:created', 'issue:updated'],
      };

      const result = await BitbucketServicesHelper.createRepositoryWebhook(
        workspace,
        'repo1',
        webhookRequest
      );

      expect(result).toEqual(webhookResponse);
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });

    it('should throw an error when the axios call fails', async () => {
      const workspace = {name: 'workspace1', token: 'token1'};
      const webhookRequest: WebhookRequest = {
        description: 'Webhook Description',
        url: 'https://example.com/',
        active: true,
        secret: 'this is a really bad secret',
        events: ['repo:push', 'issue:created', 'issue:updated'],
      };

      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        BitbucketServicesHelper.createRepositoryWebhook(
          workspace,
          'repo1',
          webhookRequest
        )
      ).rejects.toThrow('Network error');
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateRepositoryWebhook', () => {
    it('should return the updated webhook response when the axios call is successful', async () => {
      const workspace = {name: 'workspace1', token: 'token1'};
      const webhookResponse: WebhookResponse = {
        type: '<string>',
        uuid: '<string>',
        url: '<string>',
        description: '<string>',
        subject_type: 'repository',
        active: true,
        created_at: '<string>',
        events: ['issue:comment_created'],
        secret_set: true,
        secret: '<string>',
      };
      const mockResponse = {
        data: webhookResponse,
        status: 200,
        statusText: 'OK',
      };
      mockedAxios.put.mockResolvedValue(mockResponse);

      const webhookRequest: WebhookRequest = {
        description: 'Updated Webhook Description',
        url: 'https://example.com/',
        active: true,
        secret: 'this is a really bad secret',
        events: ['repo:push', 'issue:created', 'issue:updated'],
      };

      const result = await BitbucketServicesHelper.updateRepositoryWebhook(
        workspace,
        'repo1',
        'webhookUuid',
        webhookRequest
      );

      expect(result).toEqual(webhookResponse);
      expect(mockedAxios.put).toHaveBeenCalledTimes(1);
    });

    it('should throw an error when the axios call fails', async () => {
      const workspace = {name: 'workspace1', token: 'token1'};
      const webhookRequest: WebhookRequest = {
        description: 'Updated Webhook Description',
        url: 'https://example.com/',
        active: true,
        secret: 'this is a really bad secret',
        events: ['repo:push', 'issue:created', 'issue:updated'],
      };

      mockedAxios.put.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        BitbucketServicesHelper.updateRepositoryWebhook(
          workspace,
          'repo1',
          'webhookUuid',
          webhookRequest
        )
      ).rejects.toThrow('Network error');
      expect(mockedAxios.put).toHaveBeenCalledTimes(1);
    });
  });

  describe('getRepositoryWebhooks', () => {
    it('should return the repository webhooks response when the axios call is successful', async () => {
      const workspace = {name: 'workspace1', token: 'token1'};

      const repositoryWebhookResponse: RepositoryWebhookResponse = {
        size: 142,
        page: 102,
        pagelen: 159,
        next: '<string>',
        previous: '<string>',
        values: [
          {
            type: '<string>',
            uuid: '<string>',
            url: '<string>',
            description: '<string>',
            subject_type: 'repository',
            active: true,
            created_at: '<string>',
            events: ['pullrequest:changes_request_removed'],
            secret_set: true,
            secret: '<string>',
          },
        ],
      };

      const mockResponse = {
        data: repositoryWebhookResponse,
        status: 200,
        statusText: 'OK',
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await BitbucketServicesHelper.getRepositoryWebhooks(
        workspace,
        'repo1'
      );

      expect(result).toEqual(repositoryWebhookResponse);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should throw an error when the axios call fails', async () => {
      const workspace = {name: 'workspace1', token: 'token1'};

      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        BitbucketServicesHelper.getRepositoryWebhooks(workspace, 'repo1')
      ).rejects.toThrow('Network error');
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });
  });
});
