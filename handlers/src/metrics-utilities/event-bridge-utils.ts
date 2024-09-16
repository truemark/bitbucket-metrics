import {
  EventBridgeClient,
  PutRuleCommand,
  PutTargetsCommand,
} from '@aws-sdk/client-eventbridge';
import * as logging from '@nr1e/logging';

const log = logging.getLogger('event-bridge-utils');

const eventBridge = new EventBridgeClient({region: process.env.AWS_REGION});
export class EventBridgeUtils {
  public static async scheduleCron(
    cronPrefix: string,
    lambdaName: string,
    lambdaArn: string,
    retryTime: Date
  ) {
    log
      .info()
      .str('lambdaName', lambdaName)
      .str('retryTime', retryTime.toString())
      .msg('Scheduling cron job');

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
