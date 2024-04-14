import {BitbucketMetricsPublisher} from './bitbucket-metrics-publisher';
import {StandardUnit} from '@aws-sdk/client-cloudwatch';
import {BitbucketEvent} from './bitbucket-events-model';
import {logger} from '../logging-utils/logger';

const METRICS_NAMESPACE = 'TrueMark/Bitbucket';
const DIMENSTION_NAME_PIPELINE_STATE = 'Pipeline.State';
const DIMENSTION_NAME_PIPELINE = 'Pipeline.Name';
const DIMENSTION_NAME_REPOSITORY = 'Repository.Name';
const DIMENSTION_NAME_REPOSITORY_BRANCH = 'Repository.Branch';
const DIMENSTION_NAME_WORKSPACE = 'Workspace.Name';

interface MetricStructure {
  name: string;
  unit: StandardUnit;
}

export class BitBucketMetricsProcessor {
  private static getMetricStructure(pipelineState: string): MetricStructure {
    if (pipelineState === 'FAILED') {
      return {name: 'PipelineErrors', unit: StandardUnit.Count};
    } else if (pipelineState === 'SUCCESSFUL') {
      return {name: 'PipelineSuccess', unit: StandardUnit.Count};
    }
    return {name: 'NONE', unit: StandardUnit.None};
  }

  public static async process(event: BitbucketEvent): Promise<void> {
    logger.debug('Received event:', JSON.stringify(event, null, 2));
    if (!event.commit_status) {
      logger.info('Not a pipeline event. Ignoring.');
      return;
    }
    const pipelineState = event.commit_status.state;
    const metricStructure = this.getMetricStructure(pipelineState);
    if (metricStructure.name === 'NONE') {
      logger.info('Unsupported pipeline state. Ignoring');
      return;
    }
    const repositoryName = event.repository.name;
    const repositoryBranchName = event.commit_status.refname;
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
          {
            Name: DIMENSTION_NAME_REPOSITORY_BRANCH,
            Value: repositoryBranchName,
          },
        ],
        metricStructure.unit,
        1,
        pipelineTime
      );
    } else {
      logger.error(`Invalid metric unit ${metricStructure.unit}`);
    }
  }
}
