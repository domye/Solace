/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { handler_Response } from '../models/handler_Response';
import type { request_CreateTagRequest } from '../models/request_CreateTagRequest';
import type { request_UpdateTagRequest } from '../models/request_UpdateTagRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class TagService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * 获取标签列表
   * @returns handler_Response OK
   * @throws ApiError
   */
  public getTags(): CancelablePromise<handler_Response> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/tags',
    });
  }
  /**
   * 创建标签
   * @param request 标签数据
   * @returns handler_Response Created
   * @throws ApiError
   */
  public postTags(
    request: request_CreateTagRequest,
  ): CancelablePromise<handler_Response> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/tags',
      body: request,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
      },
    });
  }
  /**
   * 根据Slug获取标签
   * @param slug 标签Slug
   * @returns handler_Response OK
   * @throws ApiError
   */
  public getTagsSlug(
    slug: string,
  ): CancelablePromise<handler_Response> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/tags/slug/{slug}',
      path: {
        'slug': slug,
      },
      errors: {
        404: `Not Found`,
      },
    });
  }
  /**
   * 根据ID获取标签
   * @param id 标签ID
   * @returns handler_Response OK
   * @throws ApiError
   */
  public getTags1(
    id: number,
  ): CancelablePromise<handler_Response> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/tags/{id}',
      path: {
        'id': id,
      },
      errors: {
        404: `Not Found`,
      },
    });
  }
  /**
   * 更新标签
   * @param id 标签ID
   * @param request 标签数据
   * @returns handler_Response OK
   * @throws ApiError
   */
  public putTags(
    id: number,
    request: request_UpdateTagRequest,
  ): CancelablePromise<handler_Response> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/tags/{id}',
      path: {
        'id': id,
      },
      body: request,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
      },
    });
  }
  /**
   * 删除标签
   * @param id 标签ID
   * @returns void
   * @throws ApiError
   */
  public deleteTags(
    id: number,
  ): CancelablePromise<void> {
    return this.httpRequest.request({
      method: 'DELETE',
      url: '/tags/{id}',
      path: {
        'id': id,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
      },
    });
  }
}
