import {logger} from '../logging-utils/logger';
import {
  EventBridgeClient,
  PutRuleCommand,
  PutTargetsCommand,
} from '@aws-sdk/client-eventbridge';

const eventBridge = new EventBridgeClient({region: process.env.AWS_REGION});
export class EventBridgeUtils {
  public static async scheduleCron(
    cronPrefix: string,
    lambdaName: string,
    lambdaArn: string,
    retryTime: Date
  ) {
    logger.info(
      `Scheduling cron job: ${lambdaName} at ${retryTime} and arn: ${lambdaArn}`
    );

    const ruleName = `${cronPrefix}-Retry`;
    await eventBridge.send(
      new PutRuleCommand({
        Name: ruleName,
        ScheduleExpression: `cron(${retryTime.getMinutes()} ${retryTime.getHours()} ${retryTime.getDate()} ${
          retryTime.getMonth() + 1
        } ? ${retryTime.getFullYear()})`,
      })
    );

    await eventBridge.send(
      new PutTargetsCommand({
        Rule: ruleName,
        Targets: [
          {
            Id: 'retryTarget',
            Arn: lambdaArn,
          },
        ],
      })
    );
  }
}
