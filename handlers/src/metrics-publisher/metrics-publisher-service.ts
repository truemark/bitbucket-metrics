import {BitbucketMetricsPublisher} from './bitbucket-metrics-publisher';
import {StandardUnit} from '@aws-sdk/client-cloudwatch';
import {BitbucketEvent} from './bitbucket-events-model';

const METRICS_NAMESPACE = 'TrueMark/Bitbucket';
const DIMENSTION_NAME_PIPELINE_STATE = 'PipelineState';
export async function publishBitbucketMetrics(
  event: BitbucketEvent
): Promise<void> {
  console.debug('Received event:', JSON.stringify(event, null, 2));

  const metricsPublisher = new BitbucketMetricsPublisher(METRICS_NAMESPACE);

  metricsPublisher.publish(
    'PipelineErrors',
    DIMENSTION_NAME_PIPELINE_STATE,
    'FAILED',
    StandardUnit.Count,
    1,
    new Date()
  );

  metricsPublisher.publish(
    'PipelineSuccess',
    DIMENSTION_NAME_PIPELINE_STATE,
    'SUCCESSFUL',
    StandardUnit.Count,
    1,
    new Date()
  );
}
