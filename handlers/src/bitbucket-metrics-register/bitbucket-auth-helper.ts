import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import * as logging from '@nr1e/logging';

const log = logging.getLogger('bitbucket-auth-helper');
const AWS_REGION = process.env.AWS_REGION;
const secretsManagerClient = new SecretsManagerClient({region: AWS_REGION});

export interface Workspace {
  readonly name: string;
  readonly token: string;
}

export interface ScmData {
  readonly callBackCode: string;
  readonly callBackUrl: string;
  readonly workspaces: Workspace[];
  readonly repositories: string[];
}

export class BitbucketAuthHelper {
  public static async getScmData(secretName: string): Promise<ScmData | null> {
    try {
      const command = new GetSecretValueCommand({
        SecretId: secretName,
      });
      const response = await secretsManagerClient.send(command);
      log.debug().msg('Secrets Manager response received');
      return JSON.parse(response!.SecretString!);
    } catch (error) {
      log.error().err(error).msg('Error occurred while fetching secret');
      throw new Error('Error occurred while fetching secret');
    }
  }
}
