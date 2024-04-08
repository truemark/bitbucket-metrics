import {
  ExtendedNodejsFunction,
  ExtendedNodejsFunctionProps,
} from 'truemark-cdk-lib/aws-lambda';
import {Construct} from 'constructs';
import * as path from 'path';
import {Architecture, Runtime} from 'aws-cdk-lib/aws-lambda';
import {RetentionDays} from 'aws-cdk-lib/aws-logs';
import {Rule, Schedule} from 'aws-cdk-lib/aws-events';
import {LambdaFunction} from 'aws-cdk-lib/aws-events-targets';
import {Secret} from 'aws-cdk-lib/aws-secretsmanager';

export interface CronFunctionProps extends ExtendedNodejsFunctionProps {
  readonly cronExpression: string;
}
export class BitbucketMetricsRegisterFunction extends ExtendedNodejsFunction {
  constructor(scope: Construct, id: string, props: CronFunctionProps) {
    super(scope, id, {
      entry: path.join(
        __dirname,
        '..',
        '..',
        'handlers',
        'src',
        'bitbucket-metrics-register',
        'bitbucket-metrics-register-handler.ts'
      ),
      memorySize: 512,
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      logRetention: RetentionDays.ONE_WEEK,
    });

    const rule = new Rule(this.stack, 'BitbucketMetricsRegisterRule', {
      schedule: Schedule.expression(props.cronExpression),
    });

    rule.addTarget(new LambdaFunction(this));

    const scmSecretManagerName = 'BitbucketScmSecret';
    new Secret(this.stack, scmSecretManagerName, {
      secretName: scmSecretManagerName,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          workspaces: [{name: 'workspace1', token: 'token1'}],
          callBackUrl: 'https://test.io',
        }),
        generateStringKey: 'callBackCode', // Needed when callback is called from Bitbucket Cloud
      },
    });
  }
}
