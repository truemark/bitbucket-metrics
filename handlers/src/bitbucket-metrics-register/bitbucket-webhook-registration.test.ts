import {
  createRepositoryWebhookAsync,
  getRepositoriesAsync,
} from './bitbucket-services-helper';
import {registerRepositoryWebhooks} from './bitbucket-webhook-registration';
import {readJsonToObject} from '../test-helpers/file-reader-test-helper';
import {getScmData} from './bitbucket-auth-helper';

jest.mock('./bitbucket-auth-helper');
jest.mock('./bitbucket-services-helper');

const mockedGetScmData = getScmData as jest.MockedFunction<typeof getScmData>;

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

  beforeEach(() => {
    process.env.SCM_SECRET_MANAGER_NAME = 'test-secret-manager-name';
  });

  afterEach(() => {
    delete process.env.SCM_SECRET_MANAGER_NAME;
    jest.clearAllMocks();
  });

  test('should register webhooks for all repositories in all workspaces', async () => {
    const scmData = readJsonToObject('../../test/data/scm-data2.json');
    const repositories = readJsonToObject('../../test/data/repositories.json');

    mockedGetScmData.mockResolvedValue(scmData);
    mockedGetRepositoriesAsync.mockResolvedValue(repositories);

    await registerRepositoryWebhooks(
      webhookName,
      callBackUrl,
      repositoryEvents
    );

    expect(mockedGetScmData).toHaveBeenCalled();
    expect(mockedGetRepositoriesAsync).toHaveBeenCalledTimes(
      scmData.workspaces.length
    );
    expect(mockedCreateRepositoryWebhookAsync).toHaveBeenCalledTimes(
      scmData.workspaces.length * repositories.values.length
    );
  });

  test('should not register webhooks if there are no repositories in a workspace', async () => {
    const scmData = readJsonToObject('../../test/data/scm-data1.json');

    mockedGetScmData.mockResolvedValue(scmData);
    mockedGetRepositoriesAsync.mockResolvedValue(null);

    await registerRepositoryWebhooks(
      webhookName,
      callBackUrl,
      repositoryEvents
    );

    expect(mockedGetScmData).toHaveBeenCalled();
    expect(mockedGetRepositoriesAsync).toHaveBeenCalledTimes(
      scmData.workspaces.length
    );
    expect(mockedCreateRepositoryWebhookAsync).not.toHaveBeenCalled();
  });

  test('should throw an error if there are no workspaces', async () => {
    mockedGetScmData.mockResolvedValue(null);

    await expect(
      registerRepositoryWebhooks(webhookName, callBackUrl, repositoryEvents)
    ).rejects.toThrow('No workspaces found or workspace values are empty');

    expect(mockedGetScmData).toHaveBeenCalled();
    expect(mockedGetRepositoriesAsync).not.toHaveBeenCalled();
    expect(mockedCreateRepositoryWebhookAsync).not.toHaveBeenCalled();
  });
});
