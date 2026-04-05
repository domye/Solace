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
   * @param category 按分类slug筛选
   * @param tag 按标签slug筛选
   * @returns handler_Response OK
   * @throws ApiError
   */
  public getArticles(
    page: number = 1,
    pageSize: number = 10,
    status?: string,
    authorId?: number,
    category?: string,
    tag?: string,
  ): CancelablePromise<handler_Response> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/articles',
      query: {
        'page': page,
        'pageSize': pageSize,
        'status': status,
        'author_id': authorId,
        'category': category,
        'tag': tag,
      },
    });
  }
  /**
   * 创建文章
   * @param request 文章数据
   * @returns handler_Response Created
   * @throws ApiError
   */
  public postArticles(
    request: request_CreateArticleRequest,
  ): CancelablePromise<handler_Response> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/articles',
      body: request,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
      },
    });
  }
  /**
   * 获取归档列表
   * @returns handler_Response OK
   * @throws ApiError
   */
  public getArticlesArchive(): CancelablePromise<handler_Response> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/articles/archive',
    });
  }
  /**
   * 搜索文章
   * @param q 搜索关键词
   * @param page 页码
   * @param pageSize 每页数量
   * @returns handler_Response OK
   * @throws ApiError
   */
  public getArticlesSearch(
    q: string,
    page: number = 1,
    pageSize: number = 10,
  ): CancelablePromise<handler_Response> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/articles/search',
      query: {
        'q': q,
        'page': page,
        'pageSize': pageSize,
      },
    });
  }
  /**
   * 根据 Slug 获取文章
   * @param slug 文章 Slug
   * @returns handler_Response OK
   * @throws ApiError
   */
  public getArticlesSlug(
    slug: string,
  ): CancelablePromise<handler_Response> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/articles/slug/{slug}',
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
  public getArticles1(
    id: number,
  ): CancelablePromise<handler_Response> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/articles/{id}',
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
  public putArticles(
    id: number,
    request: request_UpdateArticleRequest,
  ): CancelablePromise<handler_Response> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/articles/{id}',
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
  public deleteArticles(
    id: number,
  ): CancelablePromise<void> {
    return this.httpRequest.request({
      method: 'DELETE',
      url: '/articles/{id}',
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
