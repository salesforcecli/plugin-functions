/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { color } from '@heroku-cli/color';
import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';

chai.use(sinonChai);

color.enabled = false;
process.env.FORCE_COLOR = '0';

process.stdout.columns = 80;
process.stderr.columns = 80;

process.env.CLI_UX_SKIP_TTY_CHECK = 'true';

process.env.NODE_ENV = 'development';
