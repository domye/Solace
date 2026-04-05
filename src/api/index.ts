import { ApiClient, OpenAPI } from './generated';

// Configure OpenAPI base URL
OpenAPI.BASE = '/api/v1';

// Token management for authenticated requests
let currentToken: string | null = null;

export function setApiToken(token: string | null) {
  currentToken = token;
  if (token) {
    OpenAPI.HEADERS = {
      Authorization: `Bearer ${token}`,
    };
  } else {
    OpenAPI.HEADERS = {};
  }
}

export function getApiToken() {
  return currentToken;
}

// Export the API client instance
export const apiClient = new ApiClient();

// Export generated types and services
export * from './generated';