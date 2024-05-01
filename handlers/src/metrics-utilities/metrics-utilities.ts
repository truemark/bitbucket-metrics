import path from 'path';
import fs from 'fs';
import {AxiosError, AxiosRequestHeaders, AxiosResponse} from 'axios';
import * as logging from '@nr1e/logging';

const log = logging.getLogger('metrics-utilities');

export class MetricsUtilities {
  public static createRepositorySlug(repositoryName: string): string {
    // Convert to lowercase
    const slug = repositoryName.toLowerCase();

    // Replace spaces with hyphens
    return slug.replace(/\s+/g, '-');
  }

  public static readJsonToObject(filename: string) {
    const jsonFilePath = path.resolve(__dirname, filename);
    try {
      const data = fs.readFileSync(jsonFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      log.error().err(error).msg('Error reading file from disk');
    }
  }

  public static throwThrottlingError() {
    const error = new Error('Rate limit exceeded') as AxiosError;
    error.name = 'AxiosError';
    error.message = 'Max connections reached';
    error.code = '429';
    error.request = {};
    error.response = {
      status: 429,
      statusText: 'Max connections reached',
      headers: {},
      config: {
        headers: {
          Authorization: 'Bearer',
          'Content-Type': 'application/json',
          Accept: 'application/json',
        } as AxiosRequestHeaders,
      },
    } as AxiosResponse;

    throw error;
  }
}
