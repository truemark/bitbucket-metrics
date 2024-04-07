import {Construct} from 'constructs';
import {HttpApi} from 'aws-cdk-lib/aws-apigatewayv2';
import {Stack, Stage} from 'aws-cdk-lib';
import {MainFunction} from './main-function';
import {BitbucketJwtReceiverFunction} from './bitbucket-jwt-function';

export class BitbucketMetrics extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const stage = Stage.of(this);
    const stack = Stack.of(this);

    const httpApi = new HttpApi(this, 'Default', {
      apiName: `${stage?.stageName}${stack?.stackName}Gateway`,
    });

    new MainFunction(this, 'Main', {
      apiGateway: httpApi,
    });

    new BitbucketJwtReceiverFunction(this, 'BitbucketJwtReceiver', {
      apiGateway: httpApi,
    });
  }
}
