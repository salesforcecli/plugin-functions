/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { URL } from 'url';
import { Interfaces, Errors } from '@oclif/core';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import * as axiosDebugger from 'axios-debug-log';

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

export class APIError extends Errors.CLIError {
  http: AxiosError;

  body: HerokuAPIErrorOptions;

  constructor(httpError: AxiosError) {
    if (!httpError) throw new Error('invalid error');
    const options: HerokuAPIErrorOptions = httpError.response?.data;
    if (!options || !options.message) throw httpError;
    const info = [];
    if (options.id) info.push(`Error ID: ${options.id}`);
    if (options.app && options.app.name) info.push(`App: ${options.app.name}`);
    if (options.url) info.push(`See ${options.url} for more information.`);
    if (info.length) super([options.message, ''].concat(info).join('\n'));
    else super(options.message);
    this.http = httpError;
    this.body = options;
  }
}

export default class APIClient {
  private axios: AxiosInstance;

  private auth: string;

  private apiUrl: URL;

  constructor(protected config: Interfaces.Config, options: APIClientConfig) {
    this.auth = options.auth;
    this.apiUrl = options.apiUrl;

    const envHeaders = JSON.parse(process.env.SALESFORCE_FUNCTIONS_HEADERS || '{}');

    const opts = {
      baseURL: `${this.apiUrl.origin}`,
      headers: {
        Accept: 'application/vnd.heroku+json; version=3',
        'user-agent': `sfdx-cli/${this.config.version} ${this.config.platform}`,
        ...envHeaders,
      },
    };
    this.axios = axios.create(opts);
    axiosDebugger.addLogger(this.axios);
  }

  async request<T>(url: string, options: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    options.headers = options.headers || {};

    if (!Object.keys(options.headers).find((header) => header.toLowerCase() === 'authorization')) {
      options.headers.authorization = `Bearer ${this.auth}`;
    }

    try {
      const response = await this.axios.request<T>({
        url,
        ...options,
      });

      return response;
    } catch (error) {
      if (!axios.isAxiosError(error)) {
        throw error;
      }

      throw new APIError(error);
    }
  }

  get<T>(url: string, options: AxiosRequestConfig = {}) {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  post<T>(url: string, options: AxiosRequestConfig = {}) {
    return this.request<T>(url, { ...options, method: 'POST' });
  }

  put<T>(url: string, options: AxiosRequestConfig = {}) {
    return this.request<T>(url, { ...options, method: 'PUT' });
  }

  patch<T>(url: string, options: AxiosRequestConfig = {}) {
    return this.request<T>(url, { ...options, method: 'PATCH' });
  }

  delete<T>(url: string, options: AxiosRequestConfig = {}) {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }
}
