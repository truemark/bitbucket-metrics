import {publishBitbucketMetrics} from './metrics-publisher-service';
import {BitbucketMetricsPublisher} from './bitbucket-metrics-publisher';
import {StandardUnit} from '@aws-sdk/client-cloudwatch';
import {readJsonToObject} from '../test-helpers/file-reader-test-helper';

jest.mock('./bitbucket-metrics-publisher');

describe('publishBitbucketMetrics', () => {
  let mockPublish: jest.Mock;

  beforeEach(() => {
    mockPublish = jest.fn();
    (BitbucketMetricsPublisher as jest.Mock).mockImplementation(() => {
      return {
        publish: mockPublish,
      };
    });
  });

  it('should ignore if event.commit_status is not present', async () => {
    const event = readJsonToObject(
      '../../test/data/repository-other-event-unescaped.json'
    );
    await publishBitbucketMetrics(event);
    expect(mockPublish).not.toHaveBeenCalled();
  });

  it('should publish with "PipelineErrors" metric when pipelineState is "FAILED"', async () => {
    const event = readJsonToObject(
      '../../test/data/pipeline-failed-event-unescaped.json'
    );
    await publishBitbucketMetrics(event);
    expect(mockPublish).toHaveBeenCalledWith(
      'PipelineErrors',
      expect.anything(),
      StandardUnit.Count,
      1,
      expect.anything()
    );
  });

  it('should publish with "PipelineSuccess" metric when pipelineState is "SUCCESSFUL"', async () => {
    const event = readJsonToObject(
      '../../test/data/pipeline-success-event-unescaped.json'
    );
    await publishBitbucketMetrics(event);
    expect(mockPublish).toHaveBeenCalledWith(
      'PipelineSuccess',
      expect.anything(),
      StandardUnit.Count,
      1,
      expect.anything()
    );
  });

  it('should throw an error when the pipeline state is not supported', async () => {
    const event = readJsonToObject(
      '../../test/data/pipeline-inprogress-event-unescaped.json'
    );
    await expect(publishBitbucketMetrics(event)).rejects.toThrow(
      'Invalid pipeline state'
    );
  });
});
