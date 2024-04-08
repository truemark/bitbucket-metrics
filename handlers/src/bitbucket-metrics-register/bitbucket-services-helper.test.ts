import axios from 'axios';
import {
  getRepositoriesAsync,
  createRepositoryWebhookAsync,
} from './bitbucket-services-helper';
import {WebhookRequest, WebhookResponse} from './bitbucket-services-model';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('bitbucket-services-helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRepositoriesAsync', () => {
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

      const result = await getRepositoriesAsync(workspace);

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

      const result = await getRepositoriesAsync(workspace);

      expect(result).toEqual(repositoriesResponse);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should throw an error when the axios call fails', async () => {
      const workspace = {name: 'workspace1', token: 'token1'};

      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(getRepositoriesAsync(workspace)).rejects.toThrow(
        'Network error'
      );
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('createRepositoryWebhookAsync', () => {
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

      const result = await createRepositoryWebhookAsync(
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
        createRepositoryWebhookAsync(workspace, 'repo1', webhookRequest)
      ).rejects.toThrow('Network error');
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });
  });
});
