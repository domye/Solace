/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { handler_Response } from '../models/handler_Response';
import type { request_LoginRequest } from '../models/request_LoginRequest';
import type { request_RefreshTokenRequest } from '../models/request_RefreshTokenRequest';
import type { request_RegisterRequest } from '../models/request_RegisterRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class AuthService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * 用户登录
   * @param request 登录凭据
   * @returns handler_Response OK
   * @throws ApiError
   */
  public postApiV1AuthLogin(
    request: request_LoginRequest,
  ): CancelablePromise<handler_Response> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/v1/auth/login',
      body: request,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
      },
    });
  }
  /**
   * 用户登出
   * @param request 要撤销的刷新令牌
   * @returns handler_Response OK
   * @throws ApiError
   */
  public postApiV1AuthLogout(
    request: request_RefreshTokenRequest,
  ): CancelablePromise<handler_Response> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/v1/auth/logout',
      body: request,
      errors: {
        400: `Bad Request`,
      },
    });
  }
  /**
   * 刷新访问令牌
   * @param request 刷新令牌
   * @returns handler_Response OK
   * @throws ApiError
   */
  public postApiV1AuthRefresh(
    request: request_RefreshTokenRequest,
  ): CancelablePromise<handler_Response> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      body: request,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
      },
    });
  }
  /**
   * 用户注册
   * @param request 注册数据
   * @returns handler_Response Created
   * @throws ApiError
   */
  public postApiV1AuthRegister(
    request: request_RegisterRequest,
  ): CancelablePromise<handler_Response> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/v1/auth/register',
      body: request,
      errors: {
        400: `Bad Request`,
        409: `Conflict`,
      },
    });
  }
}
