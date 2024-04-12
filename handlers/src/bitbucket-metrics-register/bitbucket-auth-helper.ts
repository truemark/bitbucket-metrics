import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';

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
}
export class BitbucketAuthHelper {
  public static async getScmData(secretName: string): Promise<ScmData | null> {
    try {
      const command = new GetSecretValueCommand({
        SecretId: secretName,
      });
      const response = await secretsManagerClient.send(command);
      return JSON.parse(response!.SecretString!);
    } catch (error) {
      console.error('Error fetching Scm Data from secret. Exiting. ', error);
      throw error;
    }
  }
}
