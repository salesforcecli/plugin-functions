/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as execa from 'execa';
import Redactor from './redactor';

export class Git {
  redacted: string[];

  constructor(redacted: string[] = []) {
    this.redacted = redacted;
  }

  async exec(commands: string[], quiet = false) {
    try {
      const subprocess = execa('git', commands);

      if (!quiet) {
        // for some reason execa pipes everything to stderr as it's happening instead of stdout, so
        // we use subprocess.stderr for streaming the server output
        subprocess.stderr?.pipe(new Redactor(this.redacted)).pipe(process.stderr);
      }

      return subprocess;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('Git must be installed in order to deploy Salesforce Functions');
      }

      throw error;
    }
  }

  async status() {
    const { stdout } = await this.exec(['status'], true);
    return stdout;
  }

  async hasUnpushedFiles() {
    const status = await this.status();

    return (
      status.includes('Untracked files:') ||
      status.includes('Changes to be committed:') ||
      status.includes('Changes not staged for commit:')
    );
  }
}

export default Git;
