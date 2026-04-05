/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type request_CreateArticleRequest = {
  category_id?: number;
  content: string;
  cover_image?: string;
  status?: request_CreateArticleRequest.status;
  summary?: string;
  tag_ids?: Array<number>;
  title: string;
};
export namespace request_CreateArticleRequest {
  export enum status {
    DRAFT = 'draft',
    PUBLISHED = 'published',
  }
}

