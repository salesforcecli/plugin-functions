import * as Heroku from '@heroku-cli/schema'

// see https://github.com/heroku/api/blob/77e1eab0fdd026e3ae9e62acddf5feb833a9688d/lib/api/serializers/user.rb#L141-L153
export default interface SfdcAccount extends Heroku.Account {
  salesforce_org: {
    id: string;
    team: {
      name: string;
      id: string;
    };
    organization_id: string;
    custom_domain: string;
  };
}
