import axios from 'axios';
import {getAuthToken} from './bitbucket-auth-helper';
import {
  getRepositoriesAsync,
  createRepositoryWebhookAsync,
} from './bitbucket-services-helper';
import {WebhookRequest, WebhookResponse} from './bitbucket-services-model';

jest.mock('axios');
jest.mock('./bitbucket-auth-helper');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedGetAuthToken = getAuthToken as jest.MockedFunction<
  typeof getAuthToken
>;

describe('repositories-helper', () => {
  beforeEach(() => {
    mockedGetAuthToken.mockReturnValue('dummyToken');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getRepositoriesAsync should return repositories response', async () => {
    const mockResponse = {data: 'mockData', status: 200, statusText: 'OK'};
    mockedAxios.get.mockResolvedValue(mockResponse);

    const result = await getRepositoriesAsync('workspace');

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://api.bitbucket.org/2.0/repositories/workspace',
      {
        headers: {
          Authorization: 'Bearer dummyToken',
          Accept: 'application/json',
        },
      }
    );
    expect(result).toBe('mockData');
  });

  test('createRepositoryWebhookAsync should return webhook response', async () => {
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
      'workspace',
      'repositoryUuid',
      webhookRequest
    );

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://api.bitbucket.org/2.0/repositories/workspace/repositoryUuid/hooks',
      webhookRequest,
      {
        headers: {
          Authorization: 'Bearer dummyToken',
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );
    expect(result).toBe(webhookResponse);
  });
});
