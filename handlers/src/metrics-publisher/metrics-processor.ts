import {BitbucketMetricsPublisher} from './bitbucket-metrics-publisher';
import {StandardUnit} from '@aws-sdk/client-cloudwatch';
import {BitbucketEvent} from './bitbucket-events-model';
import * as logging from '@nr1e/logging';

const METRICS_NAMESPACE = 'TrueMark/Bitbucket';
const DIMENSTION_NAME_PIPELINE_STATE = 'PipelineState';
const DIMENSTION_NAME_REPOSITORY = 'RepositoryName';
const DIMENSTION_NAME_REPOSITORY_BRANCH = 'RepositoryBranch';
const DIMENSTION_NAME_WORKSPACE = 'WorkspaceName';
const log = logging.getLogger('metrics-processor');

interface MetricStructure {
  name: string;
  unit: StandardUnit;
}
export class BitBucketMetricsProcessor {
  private static getMetricStructure(pipelineState: string): MetricStructure {
    if (pipelineState === 'FAILED' || pipelineState === 'SUCCESSFUL') {
      return {name: 'PipelineStatus', unit: StandardUnit.Count};
    }
    return {name: 'NONE', unit: StandardUnit.None};
  }

  public static async process(event: BitbucketEvent): Promise<void> {
    log.debug().obj('event', event).msg('Received bitbucket event');
    if (!event.commit_status) {
      log.info().msg('Not a pipeline event. Ignoring.');
      return;
    }
    const pipelineState = event.commit_status.state;
    const metricStructure = this.getMetricStructure(pipelineState);
    if (metricStructure.name === 'NONE') {
      log.info().msg('Unsupported pipeline state. Ignoring');
      return;
    }
    const repositoryName = event.repository.name;
    const repositoryBranchName = event.commit_status.refname;
    const workspaceName = event.repository.workspace.name;
    const pipelineTime = new Date(event.commit_status.updated_on);

    const metricsPublisher = new BitbucketMetricsPublisher(METRICS_NAMESPACE);

    if (metricStructure.unit === StandardUnit.Count) {
      await metricsPublisher.publish(
        metricStructure.name,
        [
          {Name: DIMENSTION_NAME_PIPELINE_STATE, Value: pipelineState},
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
      log.warn().str('unit', metricStructure.unit).msg('Invalid metric unit');
    }
  }
}
