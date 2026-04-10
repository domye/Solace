/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseHttpRequest } from './core/BaseHttpRequest';
import type { OpenAPIConfig } from './core/OpenAPI';
import { FetchHttpRequest } from './core/FetchHttpRequest';
import { ArticleService } from './services/ArticleService';
import { AuthService } from './services/AuthService';
import { CategoryService } from './services/CategoryService';
import { GithubService } from './services/GithubService';
import { OwnerService } from './services/OwnerService';
import { TagService } from './services/TagService';
type HttpRequestConstructor = new (config: OpenAPIConfig) => BaseHttpRequest;
export class ApiClient {
  public readonly article: ArticleService;
  public readonly auth: AuthService;
  public readonly category: CategoryService;
  public readonly github: GithubService;
  public readonly owner: OwnerService;
  public readonly tag: TagService;
  public readonly request: BaseHttpRequest;
  constructor(config?: Partial<OpenAPIConfig>, HttpRequest: HttpRequestConstructor = FetchHttpRequest) {
    this.request = new HttpRequest({
      BASE: config?.BASE ?? 'http://localhost:8080/api/v1',
      VERSION: config?.VERSION ?? '1.0',
      WITH_CREDENTIALS: config?.WITH_CREDENTIALS ?? false,
      CREDENTIALS: config?.CREDENTIALS ?? 'include',
      TOKEN: config?.TOKEN,
      USERNAME: config?.USERNAME,
      PASSWORD: config?.PASSWORD,
      HEADERS: config?.HEADERS,
      ENCODE_PATH: config?.ENCODE_PATH,
    });
    this.article = new ArticleService(this.request);
    this.auth = new AuthService(this.request);
    this.category = new CategoryService(this.request);
    this.github = new GithubService(this.request);
    this.owner = new OwnerService(this.request);
    this.tag = new TagService(this.request);
  }
}

