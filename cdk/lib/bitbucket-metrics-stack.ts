import {Construct} from 'constructs';
import {ExtendedStack, ExtendedStackProps} from 'truemark-cdk-lib/aws-cdk';
import {BitbucketMetrics} from './bitbucket-metrics';

export class BitbucketMetricsStack extends ExtendedStack {
  constructor(scope: Construct, id: string, props: ExtendedStackProps) {
    super(scope, id, props);
    new BitbucketMetrics(this, 'BitBucketMetrics');
  }
}
