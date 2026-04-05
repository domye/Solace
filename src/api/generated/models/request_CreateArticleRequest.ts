/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type request_CreateArticleRequest = {
  content: string;
  status?: request_CreateArticleRequest.status;
  summary?: string;
  title: string;
};
export namespace request_CreateArticleRequest {
  export enum status {
    DRAFT = 'draft',
    PUBLISHED = 'published',
  }
}

