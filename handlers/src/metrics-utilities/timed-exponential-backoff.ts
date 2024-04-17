/** @internal */
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  Method,
} from 'axios';
import {logger} from '../logging-utils/logger';

export class TimedExponentialBackoff {
  private readonly initialDelay: number;
  private readonly maxDelay: number;
  private readonly multiplier: number;
  private readonly jitter: number;
  private readonly remainingTimeHeader: string;

  private nextDelay: number;
  private nextDelayWithJitter: number;

  constructor(remainingTimeHeader: string) {
    this.initialDelay = 300_000; //ms
    this.maxDelay = 300_0000; // Maximum delay between retries
    this.multiplier = 5; // Exponential backoff multiplier
    this.jitter = Math.floor(Math.random() * 10);

    this.nextDelay = this.initialDelay;
    this.nextDelayWithJitter = this.initialDelay;
    this.remainingTimeHeader = remainingTimeHeader;
  }

  reset() {
    this.nextDelay = this.initialDelay;
    this.nextDelayWithJitter = this.initialDelay;
  }

  delay() {
    const delay = this.nextDelayWithJitter;
    this.nextDelay = Math.min(this.nextDelay * this.multiplier, this.maxDelay);
    this.nextDelayWithJitter =
      this.nextDelay + Math.floor(Math.random() * this.jitter);
    return delay;
  }

  public async makeRequest(
    url: string,
    method: Method,
    headers?: {[key: string]: string},
    data?: any,
    retries = 3
  ): Promise<AxiosResponse<any>> {
    const config: AxiosRequestConfig = {
      method: method,
      url: url,
      auth: {
        username: 'username', // Replace with actual credentials or use environment variables
        password: 'app_password',
      },
      headers,
      data: data,
    };

    try {
      return await axios(config);
    } catch (error) {
      const axiosError = error as AxiosError;
      if (
        axiosError.response &&
        axiosError.response.status === 429 &&
        retries > 0
      ) {
        // Handle rate limit exceeded, with retry-after support
        let retryAfter = parseInt(
          axiosError.response.headers[this.remainingTimeHeader],
          10
        );

        if (retryAfter) {
          retryAfter = retryAfter * 1000;
          logger.info(
            `API Timed Back off:: Rate limit exceeded. Retrying after ${
              retryAfter / 1000
            } seconds.`
          );
        } else {
          retryAfter = this.delay();
          logger.info(
            `Exponential Back off:: Rate limit exceeded. Retrying after ${
              retryAfter / 1000
            } seconds.`
          );
        }

        logger.info(
          `Rate limit exceeded. Retrying after ${retryAfter / 1000} seconds.`
        );
        await new Promise(resolve => setTimeout(resolve, retryAfter));
        return this.makeRequest(url, method, data, retries - 1); // Retry the request
      } else {
        throw axiosError;
      }
    }
  }
}
