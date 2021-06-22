/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'path';
import { Flags } from '@oclif/core';
import ProjectGenerator from '@salesforce/templates/lib/generators/projectGenerator';
import * as fs from 'fs-extra';
import { createEnv } from 'yeoman-environment';
import Command from '../../lib/base';

const options = {
  outputdir: '.',
  template: 'standard',
  loginurl: 'https://login.salesforce.com',
  defaultpackagedir: 'force-app',
  ns: '',
};

export default class GenerateProject extends Command {
  static flags = {
    name: Flags.string({
      description: 'name of the generated project',
      char: 'n',
      required: true,
    }),
  };

  async run() {
    const { flags } = await this.parse(GenerateProject);

    if (flags.name.includes('-')) {
      this.error('Project names may not include hyphens, please either remove them or use underscores.');
    }

    const projectPath = path.resolve(`./${flags.name}`);

    if (await fs.pathExists(projectPath)) {
      this.error(`Directory ${flags.name} already exists.`);
    }

    const env = createEnv();
    env.registerStub(ProjectGenerator, 'project-generator');

    try {
      await env.run('project-generator', { ...options, projectname: flags.name }, (err) => {
        if (err) {
          this.error(err);
        }
      });
    } catch (error) {
      // This is an error that is specific to the yeoman-environment package. It comes up whenever
      // someone has a package.json in the directory they are trying to generate a project in, or
      // one of its ancestors. The default error message is also complete useless, so we'll catch it
      // instead of provide useful feedback
      if (error.message?.includes('A name parameter is required to create a storage')) {
        this.error(
          'There was an issue generating the project. Please ensure there are no package.json ' +
            'files in this directory or any of its parents.'
        );
      }

      throw error;
    }
  }
}
