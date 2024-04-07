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
  }
}
