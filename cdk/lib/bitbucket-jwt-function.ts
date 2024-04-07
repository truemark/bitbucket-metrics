import {ExtendedNodejsFunction} from 'truemark-cdk-lib/aws-lambda';
import {Construct} from 'constructs';
import * as path from 'path';
import {Architecture, Runtime} from 'aws-cdk-lib/aws-lambda';
import {RetentionDays} from 'aws-cdk-lib/aws-logs';
import {HttpLambdaIntegration} from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import {MainFunctionProps} from './metrics-publisher-function';
import {HttpMethod} from 'aws-cdk-lib/aws-apigatewayv2';

export class BitbucketJwtReceiverFunction extends ExtendedNodejsFunction {
  constructor(scope: Construct, id: string, props: MainFunctionProps) {
    super(scope, id, {
      entry: path.join(
        __dirname,
        '..',
        '..',
        'handlers',
        'src',
        'bitbucket-jwt-receiver',
        'bitbucket-jwt-handler.ts'
      ),
      memorySize: 512,
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      logRetention: RetentionDays.ONE_WEEK,
    });

    const integration = new HttpLambdaIntegration('Integration', this);
    props.apiGateway.addRoutes({
      path: '/bitbucket/jwt-receivers',
      methods: [HttpMethod.POST],
      integration,
    });
  }
}
