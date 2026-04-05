/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { handler_Response } from '../models/handler_Response';
import type { request_CreateArticleRequest } from '../models/request_CreateArticleRequest';
import type { request_UpdateArticleRequest } from '../models/request_UpdateArticleRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class ArticleService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * 获取文章列表
   * @param page 页码
   * @param pageSize 每页数量
   * @param status 按状态筛选
   * @param authorId 按作者ID筛选
   * @returns handler_Response OK
   * @throws ApiError
   */
  public getApiV1Articles(
    page: number = 1,
    pageSize: number = 10,
    status?: string,
    authorId?: number,
  ): CancelablePromise<handler_Response> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1/articles',
      query: {
        'page': page,
        'pageSize': pageSize,
        'status': status,
        'author_id': authorId,
      },
    });
  }
  /**
   * 创建文章
   * @param request 文章数据
   * @returns handler_Response Created
   * @throws ApiError
   */
  public postApiV1Articles(
    request: request_CreateArticleRequest,
  ): CancelablePromise<handler_Response> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/v1/articles',
      body: request,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
      },
    });
  }
  /**
   * 根据 Slug 获取文章
   * @param slug 文章 Slug
   * @returns handler_Response OK
   * @throws ApiError
   */
  public getApiV1ArticlesSlug(
    slug: string,
  ): CancelablePromise<handler_Response> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1/articles/slug/{slug}',
      path: {
        'slug': slug,
      },
      errors: {
        404: `Not Found`,
      },
    });
  }
  /**
   * 根据 ID 获取文章
   * @param id 文章ID
   * @returns handler_Response OK
   * @throws ApiError
   */
  public getApiV1Articles1(
    id: number,
  ): CancelablePromise<handler_Response> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1/articles/{id}',
      path: {
        'id': id,
      },
      errors: {
        404: `Not Found`,
      },
    });
  }
  /**
   * 更新文章
   * @param id 文章ID
   * @param request 文章数据
   * @returns handler_Response OK
   * @throws ApiError
   */
  public putApiV1Articles(
    id: number,
    request: request_UpdateArticleRequest,
  ): CancelablePromise<handler_Response> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/api/v1/articles/{id}',
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
   * 删除文章
   * @param id 文章ID
   * @returns void
   * @throws ApiError
   */
  public deleteApiV1Articles(
    id: number,
  ): CancelablePromise<void> {
    return this.httpRequest.request({
      method: 'DELETE',
      url: '/api/v1/articles/{id}',
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
