import {CloudWatchClientConfig} from '@aws-sdk/client-cloudwatch';
import {MetricPublisherBase} from './metrics-publisher-base';

export class BitbucketMetricsPublisher extends MetricPublisherBase {
  constructor(namespace: string, configuration?: CloudWatchClientConfig) {
    super(namespace, configuration);
  }
}
