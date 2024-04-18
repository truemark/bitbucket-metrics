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
import {Duration} from 'aws-cdk-lib';
import {PolicyStatement} from 'aws-cdk-lib/aws-iam';

const SCM_SECRETS_MANAGER_NAME = 'BitbucketScmSecret';

export interface CronFunctionProps extends ExtendedNodejsFunctionProps {
  readonly cronExpression: string;
  readonly apiGatewayUrl: string;
  readonly repositoryTrackerTableName: string;
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
      memorySize: 1024,
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      logRetention: RetentionDays.ONE_WEEK,
      timeout: Duration.minutes(15),
      environment: {
        SCM_SECRETS_MANAGER_NAME: SCM_SECRETS_MANAGER_NAME,
        REPOSITORY_TRACKER_TABLE_NAME: props.repositoryTrackerTableName,
      },
      deploymentOptions: {
        createDeployment: false,
      },
    });

    this.addToRolePolicy(
      new PolicyStatement({
        actions: [
          'secretsmanager:GetSecretValue',
          'secretsmanager:DescribeSecret',
          'secretsmanager:ListSecrets',
        ],
        resources: ['*'],
      })
    );

    this.addToRolePolicy(
      new PolicyStatement({
        actions: ['events:PutRule', 'events:PutTargets'],
        resources: ['*'],
      })
    );
    process.env.SCM_SECRET_MANAGER_NAME = SCM_SECRETS_MANAGER_NAME;

    const rule = new Rule(this.stack, 'BitbucketMetricsRegisterRule', {
      schedule: Schedule.expression(props.cronExpression),
    });

    rule.addTarget(new LambdaFunction(this));

    new Secret(this.stack, SCM_SECRETS_MANAGER_NAME, {
      secretName: SCM_SECRETS_MANAGER_NAME,
      generateSecretString: {
        secretStringTemplate: JSON.stringify(
          {
            workspaces: [{name: 'workspace1', token: 'token1'}],
            callBackUrl: `${props.apiGatewayUrl.replace(
              /\/$/,
              ''
            )}/v1/bitbucket/metrics-publishers`,
            repositories: [
              'change to ALL to allow all repositories or add specific repository names',
            ],
          },
          null,
          2
        ),
        generateStringKey: 'callBackCode', // Needed when callback is called from Bitbucket Cloud
      },
    });
  }
}
