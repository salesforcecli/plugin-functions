import * as Heroku from '@heroku-cli/schema'

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
  };
}

export type Dictionary<T> = {
  [key: string]: T;
}
