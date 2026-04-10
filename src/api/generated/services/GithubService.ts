/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { handler_Response } from '../models/handler_Response';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class GithubService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * 获取 GitHub 贡献日历
   * @returns handler_Response OK
   * @throws ApiError
   */
  public getGithubContributions(): CancelablePromise<handler_Response> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/github/contributions',
      errors: {
        400: `Bad Request`,
        500: `Internal Server Error`,
      },
    });
  }
}
