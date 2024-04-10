import {BitbucketMetricsPublisher} from './bitbucket-metrics-publisher';
import {StandardUnit} from '@aws-sdk/client-cloudwatch';
import {BitbucketEvent} from './bitbucket-events-model';

const METRICS_NAMESPACE = 'TrueMark/Bitbucket';
const DIMENSTION_NAME_PIPELINE_STATE = 'PipelineState';
const DIMENSTION_NAME_PIPELINE = 'Pipeline';
const DIMENSTION_NAME_REPOSITORY = 'Repository';
const DIMENSTION_NAME_WORKSPACE = 'Workspace';

interface MetricStructure {
  name: string;
  unit: StandardUnit;
}

function getMetricStructure(pipelineState: string): MetricStructure {
  if (pipelineState === 'FAILED') {
    return {name: 'PipelineErrors', unit: StandardUnit.Count};
  } else if (pipelineState === 'SUCCESSFUL') {
    return {name: 'PipelineSuccess', unit: StandardUnit.Count};
  }
  return {name: 'NONE', unit: StandardUnit.None};
}

export async function publishBitbucketMetrics(
  event: BitbucketEvent
): Promise<void> {
  console.debug('Received event:', JSON.stringify(event, null, 2));
  if (!event.commit_status) {
    console.info('Not a pipeline event. Ignoring.');
    return;
  }
  const pipelineState = event.commit_status.state;
  const metricStructure = getMetricStructure(pipelineState);
  if (metricStructure.name === 'NONE') {
    console.info('Unsupported pipeline state. Ignoring');
    return;
  }
  const repositoryName = event.repository.name;
  const workspaceName = event.repository.workspace.name;
  const pipelineName = event.commit_status.name;
  const pipelineTime = new Date(event.commit_status.updated_on);

  const metricsPublisher = new BitbucketMetricsPublisher(METRICS_NAMESPACE);

  if (metricStructure.unit === StandardUnit.Count) {
    await metricsPublisher.publish(
      metricStructure.name,
      [
        {Name: DIMENSTION_NAME_PIPELINE_STATE, Value: pipelineState},
        {Name: DIMENSTION_NAME_PIPELINE, Value: pipelineName},
        {Name: DIMENSTION_NAME_REPOSITORY, Value: repositoryName},
        {Name: DIMENSTION_NAME_WORKSPACE, Value: workspaceName},
        {Name: DIMENSTION_NAME_WORKSPACE, Value: workspaceName},
      ],
      metricStructure.unit,
      1,
      pipelineTime
    );
  } else {
    console.error(`Invalid metric unit ${metricStructure.unit}`);
  }
}
