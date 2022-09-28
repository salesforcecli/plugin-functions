/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { URL } from 'url';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as Transport from 'jsforce/lib/transport';

interface APIClientConfig {
  auth: string;
  apiUrl: URL;
}

export interface HerokuAPIErrorOptions {
  resource?: string;
  app?: { id: string; name: string };
  id?: string;
  message?: string;
  url?: string;
}

type ResponseType<T> = { data: T; [key: string]: any };

export default class APIClient {
  private auth: string;

  private apiUrl: URL;

  constructor(options: APIClientConfig) {
    this.auth = options.auth;
    this.apiUrl = options.apiUrl;
  }

  async request<T>(url: string, options: any): Promise<ResponseType<T>> {
    options.headers = options.headers || {};

    if (
      !Object.keys(options.headers as Record<string, string>).find((header) => header.toLowerCase() === 'authorization')
    ) {
      options.headers.authorization = `Bearer ${this.auth}`;
    }
    const baseURL = `${this.apiUrl.origin}`;

    const envHeaders = JSON.parse(process.env.SALESFORCE_FUNCTIONS_HEADERS ?? '{}');

    options.headers = {
      Accept: 'application/vnd.heroku+json; version=3',
      'Content-Type': 'application/json',
      ...envHeaders,
      ...options.headers,
    };

    const req = {
      url: `${baseURL}${url}`,
      ...options,
      body: JSON.stringify(options.data),
    };

    const response = await new Transport().httpRequest(req);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      response.data = JSON.parse(response.body);
    } catch (err) {
      // not json
    }

    if (response.statusCode >= 400) {
      const error: any = new Error(`Request failed with status code ${response.statusCode}`);
      error.data = response.data;
      throw error;
    }

    return response;
  }

  get<T>(url: string, options: Record<string, unknown> = {}) {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  post<T>(url: string, options: Record<string, unknown> = {}) {
    return this.request<T>(url, { ...options, method: 'POST' });
  }

  put<T>(url: string, options: Record<string, unknown> = {}) {
    return this.request<T>(url, { ...options, method: 'PUT' });
  }

  patch<T>(url: string, options: Record<string, unknown> = {}) {
    return this.request<T>(url, { ...options, method: 'PATCH' });
  }

  delete<T>(url: string, options: Record<string, unknown> = {}) {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }
}

export function herokuClientApiUrl(): URL {
  const defaultUrl = 'https://api.heroku.com';
  const envVarURL = process.env.SALESFORCE_FUNCTIONS_API;
  const apiURL = new URL(envVarURL ?? defaultUrl);
  return apiURL;
}
