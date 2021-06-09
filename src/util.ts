/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { ProjectDescriptor } from '@heroku/project-descriptor';

namespace Util {
  export function isUUID(spaceId: string): boolean {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const match = UUID_REGEX.exec(spaceId);

    return Boolean(match) && match?.length === 1;
  }

  export async function getProjectDescriptor(path: string): Promise<any> {
    const projectTOML = new ProjectDescriptor();
    try {
      return await projectTOML.parseFile(path);
    } catch (error) {
      if (error.message.includes('File Not Found')) {
        throw new Error(error.message + '\n Hint: Are you in the correct working directory?');
      } else {
        throw error;
      }
    }
  }
}

export default Util;
