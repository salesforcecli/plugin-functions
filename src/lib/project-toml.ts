/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { ProjectDescriptor } from '@heroku/project-descriptor';
import { cli } from 'cli-ux';

export async function parseProjectToml(fnTomlPath: string): Promise<any> {
  const parser = new ProjectDescriptor();
  try {
    return await parser.parseFile(fnTomlPath);
  } catch (error) {
    if (error.message.includes('File Not Found')) {
      cli.error(error.message + ' Are you in the correct working directory?');
    } else {
      cli.error(error.message);
    }
  }
}
