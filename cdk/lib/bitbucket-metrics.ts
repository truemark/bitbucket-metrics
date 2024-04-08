import {Construct} from 'constructs';
import {HttpApi} from 'aws-cdk-lib/aws-apigatewayv2';
import {Stack, Stage} from 'aws-cdk-lib';
import {MetricsPublisherFunction} from './metrics-publisher-function';
import {BitbucketJwtReceiverFunction} from './bitbucket-jwt-function';
import {BitbucketMetricsRegisterFunction} from './bitbucket-metrics-register-function';

export class BitbucketMetrics extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const stage = Stage.of(this);
    const stack = Stack.of(this);

    const httpApi = new HttpApi(this, 'Default', {
      apiName: `${stage?.stageName}${stack?.stackName}Gateway`,
    });

    new MetricsPublisherFunction(this, 'Publisher', {
      apiGateway: httpApi,
    });

    new BitbucketJwtReceiverFunction(this, 'JwtReceiver', {
      apiGateway: httpApi,
    });

    new BitbucketMetricsRegisterFunction(this, 'Register', {
      //cronExpression: 'cron(0 12 * * ? *)',
      cronExpression: 'cron(*/10 * * * ? *)',
    });
  }
}
