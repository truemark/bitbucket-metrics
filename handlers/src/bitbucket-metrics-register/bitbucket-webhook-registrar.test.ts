import {BitbucketServicesHelper} from './bitbucket-services-helper';
import {BitbucketWebhookRegistrar} from './bitbucket-webhook-registrar';
import {MetricsUtilities} from '../metrics-utilities/metrics-utilities';
import {BitbucketAuthHelper} from './bitbucket-auth-helper';

jest.mock('./bitbucket-auth-helper');
jest.mock('./bitbucket-services-helper');

const mockedGetScmData = BitbucketAuthHelper.getScmData as jest.MockedFunction<
  typeof BitbucketAuthHelper.getScmData
>;

const mockedGetRepositoriesAsync =
  BitbucketServicesHelper.getRepositories as jest.MockedFunction<
    typeof BitbucketServicesHelper.getRepositories
  >;
const mockedCreateRepositoryWebhookAsync =
  BitbucketServicesHelper.createRepositoryWebhook as jest.MockedFunction<
    typeof BitbucketServicesHelper.createRepositoryWebhook
  >;

describe.skip('BitbucketWebhookRegistrar.register', () => {
  const webhookName = 'PipelineEventsWebhook';
  const repositoryEvents = ['repo:push', 'issue:created', 'issue:updated'];

  beforeEach(() => {
    process.env.SCM_SECRET_MANAGER_NAME = 'test-secret-manager-name';
  });

  afterEach(() => {
    delete process.env.SCM_SECRET_MANAGER_NAME;
    jest.clearAllMocks();
  });

  test('should register webhooks for all repositories in all workspaces', async () => {
    const scmData = MetricsUtilities.readJsonToObject(
      '../../test/data/scm-data2.json'
    );
    const repositories = MetricsUtilities.readJsonToObject(
      '../../test/data/repositories.json'
    );

    mockedGetScmData.mockResolvedValue(scmData);
    mockedGetRepositoriesAsync.mockResolvedValue(repositories);

    await BitbucketWebhookRegistrar.register(webhookName, repositoryEvents);

    expect(mockedGetScmData).toHaveBeenCalled();
    expect(mockedGetRepositoriesAsync).toHaveBeenCalledTimes(
      scmData.workspaces.length
    );
    expect(mockedCreateRepositoryWebhookAsync).toHaveBeenCalledTimes(
      scmData.workspaces.length * repositories.values.length
    );
  });

  test('should not register webhooks if there are no repositories in a workspace', async () => {
    const scmData = MetricsUtilities.readJsonToObject(
      '../../test/data/scm-data1.json'
    );

    mockedGetScmData.mockResolvedValue(scmData);
    mockedGetRepositoriesAsync.mockResolvedValue(null);

    await BitbucketWebhookRegistrar.register(webhookName, repositoryEvents);

    expect(mockedGetScmData).toHaveBeenCalled();
    expect(mockedGetRepositoriesAsync).toHaveBeenCalledTimes(
      scmData.workspaces.length
    );
    expect(mockedCreateRepositoryWebhookAsync).not.toHaveBeenCalled();
  });

  test('should throw an error if there are no workspaces', async () => {
    mockedGetScmData.mockResolvedValue(null);

    await expect(
      BitbucketWebhookRegistrar.register(webhookName, repositoryEvents)
    ).rejects.toThrow('No workspaces found or workspace values are empty');

    expect(mockedGetScmData).toHaveBeenCalled();
    expect(mockedGetRepositoriesAsync).not.toHaveBeenCalled();
    expect(mockedCreateRepositoryWebhookAsync).not.toHaveBeenCalled();
  });
});
