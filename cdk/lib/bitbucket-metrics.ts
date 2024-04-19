import {Construct} from 'constructs';
import {HttpApi} from 'aws-cdk-lib/aws-apigatewayv2';
import {Stack, Stage} from 'aws-cdk-lib';
import {MetricsPublisherFunction} from './metrics-publisher-function';
import {BitbucketMetricsRegisterFunction} from './bitbucket-metrics-register-function';
import {AttributeType, BillingMode, Table} from 'aws-cdk-lib/aws-dynamodb';
import {ServicePrincipal} from 'aws-cdk-lib/aws-iam';

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

    // Create a new DynamoDB table
    const repositoryTracker = new Table(this, 'RepositoryTracker', {
      partitionKey: {name: 'id', type: AttributeType.STRING},
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    const metricsRegisterFunction = new BitbucketMetricsRegisterFunction(
      this,
      'Register',
      {
        cronExpression: 'cron(0 12 * * ? *)',
        apiGatewayUrl: httpApi.url!,
        repositoryTrackerTableName: repositoryTracker.tableName,
      }
    );

    metricsRegisterFunction.grantInvoke(
      new ServicePrincipal('events.amazonaws.com')
    );

    // Grant the Lambda function read/write permissions to the table
    repositoryTracker.grantReadWriteData(metricsRegisterFunction);
  }
}
