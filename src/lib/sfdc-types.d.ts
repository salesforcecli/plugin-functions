/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as Heroku from '@heroku-cli/schema';
import { JsonMap } from '@salesforce/ts-types';

export interface SfdcAccount extends Heroku.Account {
  salesforce_org: {
    id: string;
    owner: {
      name: string;
      id: string;
      type: string;
    };
    organization_id: string;
    custom_domain: string;
  };
  salesforce_federated: boolean;
  salesforce_username: string;
  salesforce_email: string;
}

export interface ComputeEnvironment extends Heroku.App {
  sfdx_project_name: string;
  sales_org_connection?: {
    id: string;
    sales_org_id: string;
    sales_org_stage: 'prod' | 'test';
  };
}

export type Dictionary<T> = {
  [key: string]: T;
};

export interface SfdxProjectConfig extends JsonMap {
  name: string;
  namespace: string;
}

export interface FunctionReference {
  fullName: string;
  label: string;
  description: string;
  permissionSet?: string;
}

export interface ScratchOrgFields {
  createdBy: string;
  createdDate: string;
  expirationDate: string;
  orgName: string;
  status: string;
  devHubId?: string;
  edition?: string;
  namespace?: string;
  snapshot?: string;
  lastUsed?: Date;
}

export interface OrgDisplayReturn extends Partial<ScratchOrgFields> {
  username: string;
  id: string;
  accessToken: string;
  instanceUrl: string;
  clientId: string;

  alias?: string;
  password?: string;

  // non-scratch orgs
  connectedStatus?: string;
  sfdxAuthUrl?: string;
}
