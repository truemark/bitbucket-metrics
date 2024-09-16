import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import * as logging from '@nr1e/logging';

const log = logging.getLogger('repository-tracker');

export interface RepositoryTracker {
  readonly workspaceName: string;
  readonly nextUrl: string;
}
export class RepositoryTrackerService {
  private readonly documentClient: DynamoDBDocumentClient;
  readonly repositoryTrackerTableName: string;

  constructor() {
    this.documentClient = DynamoDBDocumentClient.from(
      new DynamoDBClient({region: process.env.AWS_REGION!})
    );
    this.repositoryTrackerTableName =
      process.env.REPOSITORY_TRACKER_TABLE_NAME!;
  }

  public async saveTracker(tracker: RepositoryTracker): Promise<void> {
    const params = {
      TableName: this.repositoryTrackerTableName,
      Item: {
        id: tracker.workspaceName,
        ...tracker,
      },
    };
    try {
      await this.documentClient.send(new PutCommand(params));
      log
        .debug()
        .str('workspaceName', tracker.workspaceName)
        .msg('Saved tracker');
    } catch (error) {
      log
        .error()
        .err(error)
        .str('workspaceName', tracker.workspaceName)
        .msg('Could not save tracker');
      throw new Error(
        `Could not save tracker for workspace: ${tracker.workspaceName}`
      );
    }
  }

  public async getTracker(
    workspaceName: string
  ): Promise<RepositoryTracker | undefined> {
    const params = {
      TableName: this.repositoryTrackerTableName,
      Key: {id: workspaceName},
    };

    try {
      const data = await this.documentClient.send(new GetCommand(params));
      log.debug().str('workspaceName', workspaceName).msg('Got tracker');
      return data.Item as RepositoryTracker;
    } catch (error) {
      log
        .error()
        .err(error)
        .str('workspaceName', workspaceName)
        .msg('Could not get tracker');
      return undefined;
    }
  }
}
