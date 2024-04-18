import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {logger} from '../logging-utils/logger';

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
      logger.info(`Saved tracker for workspace: ${tracker.workspaceName}`);
    } catch (error) {
      logger.error(error);
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
      logger.info(`Got tracker for workspace: ${workspaceName}`);
      return data.Item as RepositoryTracker;
    } catch (error) {
      logger.error(`Could not get tracker for workspace: ${workspaceName}`, {
        error,
      });
      return undefined;
    }
  }
}
