import {
  createRepositoryWebhookAsync,
  getRepositoriesAsync,
  getWorkspacesAsync,
} from './bitbucket-services-helper';
import {registerRepositoryWebhooks} from './bitbucket-webhook-registration';
import {readJsonToObject} from '../test-helpers/file-reader-test-helper';

jest.mock('./bitbucket-services-helper');

const mockedGetWorkspacesAsync = getWorkspacesAsync as jest.MockedFunction<
  typeof getWorkspacesAsync
>;
const mockedGetRepositoriesAsync = getRepositoriesAsync as jest.MockedFunction<
  typeof getRepositoriesAsync
>;
const mockedCreateRepositoryWebhookAsync =
  createRepositoryWebhookAsync as jest.MockedFunction<
    typeof createRepositoryWebhookAsync
  >;

describe('registerRepositoryWebhooks', () => {
  const webhookName = 'PipelineEventsWebhook';
  const callBackUrl = 'https://example.com/callback';
  const repositoryEvents = ['repo:push', 'issue:created', 'issue:updated'];

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should register webhooks for all repositories in all workspaces', async () => {
    const workspaces = readJsonToObject('../test/data/workspaces2.json');
    const repositories = readJsonToObject('../test/data/repositories.json');

    mockedGetWorkspacesAsync.mockResolvedValue(workspaces);
    mockedGetRepositoriesAsync.mockResolvedValue(repositories);

    await registerRepositoryWebhooks(
      webhookName,
      callBackUrl,
      repositoryEvents
    );

    expect(mockedGetWorkspacesAsync).toHaveBeenCalled();
    expect(mockedGetRepositoriesAsync).toHaveBeenCalledTimes(
      workspaces.values.length
    );
    expect(mockedCreateRepositoryWebhookAsync).toHaveBeenCalledTimes(
      workspaces.values.length * repositories.values.length
    );
  });

  test('should not register webhooks if there are no repositories in a workspace', async () => {
    const workspaces = readJsonToObject('../test/data/workspaces1.json');

    mockedGetWorkspacesAsync.mockResolvedValue(workspaces);
    mockedGetRepositoriesAsync.mockResolvedValue(null);

    await registerRepositoryWebhooks(
      webhookName,
      callBackUrl,
      repositoryEvents
    );

    expect(mockedGetWorkspacesAsync).toHaveBeenCalled();
    expect(mockedGetRepositoriesAsync).toHaveBeenCalledTimes(
      workspaces.values.length
    );
    expect(mockedCreateRepositoryWebhookAsync).not.toHaveBeenCalled();
  });

  test('should throw an error if there are no workspaces', async () => {
    mockedGetWorkspacesAsync.mockResolvedValue(null);

    await expect(
      registerRepositoryWebhooks(webhookName, callBackUrl, repositoryEvents)
    ).rejects.toThrow('No workspaces found or workspace values are empty');

    expect(mockedGetWorkspacesAsync).toHaveBeenCalled();
    expect(mockedGetRepositoriesAsync).not.toHaveBeenCalled();
    expect(mockedCreateRepositoryWebhookAsync).not.toHaveBeenCalled();
  });
});
