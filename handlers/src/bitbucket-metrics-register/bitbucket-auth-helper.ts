import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';

export interface Workspace {
  readonly name: string;
  readonly token: string;
}

export interface ScmData {
  readonly callBackCode: string;
  readonly callBackUrl: string;
  readonly workspaces: Workspace[];
}

const currentRegion = process.env.AWS_REGION;
const client = new SecretsManagerClient({region: currentRegion});
export async function getScmData(secretName: string): Promise<ScmData | null> {
  try {
    const command = new GetSecretValueCommand({
      SecretId: secretName,
    });
    const response = await client.send(command);
    return JSON.parse(response!.SecretString!);
  } catch (error) {
    console.error('Error fetching Scm Data from secret. Exiting. ', error);
    throw error;
  }
}
