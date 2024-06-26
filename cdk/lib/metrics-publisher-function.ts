import {
  ExtendedNodejsFunction,
  ExtendedNodejsFunctionProps,
} from 'truemark-cdk-lib/aws-lambda';
import {Construct} from 'constructs';
import * as path from 'path';
import {Architecture, Runtime} from 'aws-cdk-lib/aws-lambda';
import {RetentionDays} from 'aws-cdk-lib/aws-logs';
import {PolicyStatement} from 'aws-cdk-lib/aws-iam';
import {HttpApi, HttpMethod} from 'aws-cdk-lib/aws-apigatewayv2';
import {HttpLambdaIntegration} from 'aws-cdk-lib/aws-apigatewayv2-integrations';

export interface MainFunctionProps extends ExtendedNodejsFunctionProps {
  readonly apiGateway: HttpApi;
}

export class MetricsPublisherFunction extends ExtendedNodejsFunction {
  constructor(scope: Construct, id: string, props: MainFunctionProps) {
    super(scope, id, {
      entry: path.join(
        __dirname,
        '..',
        '..',
        'handlers',
        'src',
        'metrics-publisher',
        'metrics-publisher-handler.ts'
      ),
      memorySize: 512,
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      logRetention: RetentionDays.ONE_WEEK,
      deploymentOptions: {
        createDeployment: false,
      },
    });

    this.addToRolePolicy(
      new PolicyStatement({
        actions: ['cloudwatch:PutMetricData'],
        resources: ['*'],
      })
    );

    const integration = new HttpLambdaIntegration('Integration', this);
    props.apiGateway.addRoutes({
      path: '/v1/bitbucket/metrics-publishers',
      methods: [HttpMethod.POST],
      integration,
    });
  }
}
