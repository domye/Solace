/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type request_UpdateArticleRequest = {
  content?: string;
  status?: request_UpdateArticleRequest.status;
  summary?: string;
  title?: string;
  version: number;
};
export namespace request_UpdateArticleRequest {
  export enum status {
    DRAFT = 'draft',
    PUBLISHED = 'published',
  }
}

