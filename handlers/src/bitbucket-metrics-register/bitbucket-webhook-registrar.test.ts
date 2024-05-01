import {BitbucketServicesHelper} from './bitbucket-services-helper';
import {BitbucketWebhookRegistrar} from './bitbucket-webhook-registrar';
import {MetricsUtilities} from '../metrics-utilities/metrics-utilities';
import {BitbucketAuthHelper} from './bitbucket-auth-helper';
import {
  expect,
  test,
  describe,
  MockedFunction,
  vi,
  beforeEach,
  afterEach,
  beforeAll,
} from 'vitest';
import * as logging from '@nr1e/logging';

beforeAll(async () => {
  await logging.initialize({
    svc: 'bitbucket-webhook-registrar.test',
    level: 'trace',
  });
});

vi.mock('./bitbucket-auth-helper');
vi.mock('./bitbucket-services-helper');

const mockedGetScmData = BitbucketAuthHelper.getScmData as MockedFunction<
  typeof BitbucketAuthHelper.getScmData
>;

const mockedGetRepositoriesPaginated =
  BitbucketServicesHelper.getRepositoriesPaginated as MockedFunction<
    typeof BitbucketServicesHelper.getRepositoriesPaginated
  >;

const mockedGetRepositoryWebhook =
  BitbucketServicesHelper.getRepositoryWebhooks as MockedFunction<
    typeof BitbucketServicesHelper.getRepositoryWebhooks
  >;

const mockedCreateRepositoryWebhook =
  BitbucketServicesHelper.createRepositoryWebhook as MockedFunction<
    typeof BitbucketServicesHelper.createRepositoryWebhook
  >;

const mockedUpdateRepositoryWebhook =
  BitbucketServicesHelper.updateRepositoryWebhook as MockedFunction<
    typeof BitbucketServicesHelper.updateRepositoryWebhook
  >;

describe('BitbucketWebhookRegistrar.register', () => {
  const webhookName = 'PipelineEventsWebhook';
  const repositoryEvents = ['repo:push', 'issue:created', 'issue:updated'];

  beforeEach(() => {
    process.env.SCM_SECRET_MANAGER_NAME = 'test-secret-manager-name';
  });

  afterEach(() => {
    delete process.env.SCM_SECRET_MANAGER_NAME;
    vi.clearAllMocks();
  });

  test('should register webhooks for all repositories in all workspaces', async () => {
    const scmData = MetricsUtilities.readJsonToObject(
      '../../test/data/scm-data2.json'
    );
    const repositories = MetricsUtilities.readJsonToObject(
      '../../test/data/repositories-no-next.json'
    );

    mockedGetScmData.mockResolvedValue(scmData);
    mockedGetRepositoriesPaginated.mockResolvedValue(repositories);

    const bitbucketWebhookRegistrar = await BitbucketWebhookRegistrar.create();
    await bitbucketWebhookRegistrar.register(webhookName, repositoryEvents);

    expect(mockedGetScmData).toHaveBeenCalled();
    expect(mockedGetRepositoriesPaginated).toHaveBeenCalledTimes(
      scmData.workspaces.length
    );
    expect(mockedGetRepositoryWebhook).toHaveBeenCalledTimes(
      scmData.workspaces.length * repositories.values.length
    );
    expect(mockedCreateRepositoryWebhook).toHaveBeenCalledTimes(
      scmData.workspaces.length * repositories.values.length
    );
  });

  test('should not register webhooks if there are no repositories in a workspace', async () => {
    const scmData = MetricsUtilities.readJsonToObject(
      '../../test/data/scm-data1.json'
    );

    mockedGetScmData.mockResolvedValue(scmData);
    mockedGetRepositoriesPaginated.mockResolvedValue(null);

    const bitbucketWebhookRegistrar = await BitbucketWebhookRegistrar.create();
    await bitbucketWebhookRegistrar.register(webhookName, repositoryEvents);

    expect(mockedGetScmData).toHaveBeenCalled();
    expect(mockedGetRepositoriesPaginated).toHaveBeenCalledTimes(
      scmData.workspaces.length
    );
    expect(mockedCreateRepositoryWebhook).not.toHaveBeenCalled();
  });

  test('should update existing webhook if an existing webhook has a different url', async () => {
    const scmData = MetricsUtilities.readJsonToObject(
      '../../test/data/scm-data1.json'
    );
    const repositories = MetricsUtilities.readJsonToObject(
      '../../test/data/repositories-no-next.json'
    );

    const webhooks = MetricsUtilities.readJsonToObject(
      '../../test/data/repository-webhook-response-different-url1.json'
    );

    mockedGetScmData.mockResolvedValue(scmData);
    mockedGetRepositoriesPaginated.mockResolvedValue(repositories);
    mockedGetRepositoryWebhook.mockResolvedValue(webhooks);

    const bitbucketWebhookRegistrar = await BitbucketWebhookRegistrar.create();
    await bitbucketWebhookRegistrar.register(webhookName, repositoryEvents);

    expect(mockedGetScmData).toHaveBeenCalled();
    expect(mockedGetRepositoriesPaginated).toHaveBeenCalledTimes(
      scmData.workspaces.length
    );
    expect(mockedGetRepositoryWebhook).toHaveBeenCalledTimes(2);
    expect(mockedUpdateRepositoryWebhook).toHaveBeenCalledTimes(2);
    expect(mockedCreateRepositoryWebhook).toHaveBeenCalledTimes(0);
  });

  test('should not update existing webhook if an existing webhook has same url as the request', async () => {
    const scmData = MetricsUtilities.readJsonToObject(
      '../../test/data/scm-data1.json'
    );
    const repositories = MetricsUtilities.readJsonToObject(
      '../../test/data/repositories-no-next.json'
    );

    const webhooks = MetricsUtilities.readJsonToObject(
      '../../test/data/repository-webhook-response-same-url1.json'
    );

    mockedGetScmData.mockResolvedValue(scmData);
    mockedGetRepositoriesPaginated.mockResolvedValue(repositories);
    mockedGetRepositoryWebhook.mockResolvedValue(webhooks);

    const bitbucketWebhookRegistrar = await BitbucketWebhookRegistrar.create();
    await bitbucketWebhookRegistrar.register(webhookName, repositoryEvents);

    expect(mockedGetScmData).toHaveBeenCalled();
    expect(mockedGetRepositoriesPaginated).toHaveBeenCalledTimes(
      scmData.workspaces.length
    );
    expect(mockedGetRepositoryWebhook).toHaveBeenCalledTimes(2);
    expect(mockedGetRepositoryWebhook).toHaveBeenCalledTimes(2);
    expect(mockedUpdateRepositoryWebhook).toHaveBeenCalledTimes(0);
    expect(mockedCreateRepositoryWebhook).toHaveBeenCalledTimes(0);
  });

  test('should do nothing if repositories found are not in the list', async () => {
    const scmData = MetricsUtilities.readJsonToObject(
      '../../test/data/scm-data-not-allowed1.json'
    );
    const repositories = MetricsUtilities.readJsonToObject(
      '../../test/data/repositories-no-next.json'
    );

    const webhooks = MetricsUtilities.readJsonToObject(
      '../../test/data/repository-webhook-response-same-url1.json'
    );

    mockedGetScmData.mockResolvedValue(scmData);
    mockedGetRepositoriesPaginated.mockResolvedValue(repositories);
    mockedGetRepositoryWebhook.mockResolvedValue(webhooks);

    const bitbucketWebhookRegistrar = await BitbucketWebhookRegistrar.create();
    await bitbucketWebhookRegistrar.register(webhookName, repositoryEvents);

    expect(mockedGetScmData).toHaveBeenCalled();
    expect(mockedGetRepositoriesPaginated).toHaveBeenCalledTimes(
      scmData.workspaces.length
    );
    expect(mockedGetRepositoryWebhook).toHaveBeenCalledTimes(2);
    expect(mockedGetRepositoryWebhook).toHaveBeenCalledTimes(2);
    expect(mockedUpdateRepositoryWebhook).toHaveBeenCalledTimes(0);
    expect(mockedCreateRepositoryWebhook).toHaveBeenCalledTimes(0);
  });

  test('should throw an error if there are no allow listed repositories in SCM Secrets', async () => {
    const scmData = MetricsUtilities.readJsonToObject(
      '../../test/data/scm-data0.json'
    );
    mockedGetScmData.mockResolvedValue(scmData);

    await expect(BitbucketWebhookRegistrar.create()).rejects.toThrow(
      'No repositories are allowed to register webhooks. Please update the SCM secret.'
    );
  });

  test('should throw an error if allowed repositories are empty in SCM Data', async () => {
    const scmData = {
      repositories: [],
      workspaces: [],
      callBackCode: 'test-code',
      callBackUrl: 'test-url',
    };

    mockedGetScmData.mockResolvedValue(scmData);

    await expect(BitbucketWebhookRegistrar.create()).rejects.toThrow(
      'No repositories are allowed to register webhooks. Please update the SCM secret.'
    );
  });
});
