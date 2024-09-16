import {BitBucketMetricsProcessor} from './metrics-processor';
import {BitbucketMetricsPublisher} from './bitbucket-metrics-publisher';
import {StandardUnit} from '@aws-sdk/client-cloudwatch';
import {MetricsUtilities} from '../metrics-utilities/metrics-utilities';
import {vi, beforeEach, expect, Mock, it, describe, beforeAll} from 'vitest';
import * as logging from '@nr1e/logging';

beforeAll(async () => {
  await logging.initialize({svc: 'metrics-processor.test', level: 'trace'});
});

vi.mock('./bitbucket-metrics-publisher');

describe('BitBucketMetricsProcessor.process', () => {
  let mockPublish: Mock;

  beforeEach(() => {
    mockPublish = vi.fn();
    (BitbucketMetricsPublisher as Mock).mockImplementation(() => {
      return {
        publish: mockPublish,
      };
    });
  });

  it('should ignore if event.commit_status is not present', async () => {
    const event = MetricsUtilities.readJsonToObject(
      '../../test/data/repository-other-event-unescaped.json'
    );
    await BitBucketMetricsProcessor.process(event);
    expect(mockPublish).not.toHaveBeenCalled();
  });

  it('should publish with "PipelineErrors" metric when pipelineState is "FAILED"', async () => {
    const event = MetricsUtilities.readJsonToObject(
      '../../test/data/pipeline-failed-event-unescaped.json'
    );
    await BitBucketMetricsProcessor.process(event);
    expect(mockPublish).toHaveBeenCalledWith(
      'PipelineStatus',
      expect.anything(),
      StandardUnit.Count,
      1,
      expect.anything()
    );
  });

  it('should publish with "PipelineSuccess" metric when pipelineState is "SUCCESSFUL"', async () => {
    const event = MetricsUtilities.readJsonToObject(
      '../../test/data/pipeline-success-event-unescaped.json'
    );
    await BitBucketMetricsProcessor.process(event);
    expect(mockPublish).toHaveBeenCalledWith(
      'PipelineStatus',
      expect.anything(),
      StandardUnit.Count,
      1,
      expect.anything()
    );
  });

  it('should throw an error when the pipeline state is not supported', async () => {
    const event = MetricsUtilities.readJsonToObject(
      '../../test/data/pipeline-inprogress-event-unescaped.json'
    );
    await BitBucketMetricsProcessor.process(event);
    expect(mockPublish).not.toHaveBeenCalled();
  });
});
