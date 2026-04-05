/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { handler_Response } from '../models/handler_Response';
import type { request_UpdateUserRequest } from '../models/request_UpdateUserRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class UserService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * 获取当前用户信息
   * @returns handler_Response OK
   * @throws ApiError
   */
  public getApiV1UsersMe(): CancelablePromise<handler_Response> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1/users/me',
      errors: {
        401: `Unauthorized`,
      },
    });
  }
  /**
   * 更新当前用户信息
   * @param request 用户数据
   * @returns handler_Response OK
   * @throws ApiError
   */
  public putApiV1UsersMe(
    request: request_UpdateUserRequest,
  ): CancelablePromise<handler_Response> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/api/v1/users/me',
      body: request,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
      },
    });
  }
  /**
   * 根据 ID 获取用户
   * @param id 用户ID
   * @returns handler_Response OK
   * @throws ApiError
   */
  public getApiV1Users(
    id: number,
  ): CancelablePromise<handler_Response> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1/users/{id}',
      path: {
        'id': id,
      },
      errors: {
        404: `Not Found`,
      },
    });
  }
}
