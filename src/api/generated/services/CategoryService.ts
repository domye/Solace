/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { handler_Response } from '../models/handler_Response';
import type { request_CreateCategoryRequest } from '../models/request_CreateCategoryRequest';
import type { request_UpdateCategoryRequest } from '../models/request_UpdateCategoryRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class CategoryService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * 获取分类列表
   * @returns handler_Response OK
   * @throws ApiError
   */
  public getCategories(): CancelablePromise<handler_Response> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/categories',
    });
  }
  /**
   * 创建分类
   * @param request 分类数据
   * @returns handler_Response Created
   * @throws ApiError
   */
  public postCategories(
    request: request_CreateCategoryRequest,
  ): CancelablePromise<handler_Response> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/categories',
      body: request,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
      },
    });
  }
  /**
   * 根据Slug获取分类
   * @param slug 分类Slug
   * @returns handler_Response OK
   * @throws ApiError
   */
  public getCategoriesSlug(
    slug: string,
  ): CancelablePromise<handler_Response> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/categories/slug/{slug}',
      path: {
        'slug': slug,
      },
      errors: {
        404: `Not Found`,
      },
    });
  }
  /**
   * 根据ID获取分类
   * @param id 分类ID
   * @returns handler_Response OK
   * @throws ApiError
   */
  public getCategories1(
    id: number,
  ): CancelablePromise<handler_Response> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/categories/{id}',
      path: {
        'id': id,
      },
      errors: {
        404: `Not Found`,
      },
    });
  }
  /**
   * 更新分类
   * @param id 分类ID
   * @param request 分类数据
   * @returns handler_Response OK
   * @throws ApiError
   */
  public putCategories(
    id: number,
    request: request_UpdateCategoryRequest,
  ): CancelablePromise<handler_Response> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/categories/{id}',
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
   * 删除分类
   * @param id 分类ID
   * @returns void
   * @throws ApiError
   */
  public deleteCategories(
    id: number,
  ): CancelablePromise<void> {
    return this.httpRequest.request({
      method: 'DELETE',
      url: '/categories/{id}',
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
