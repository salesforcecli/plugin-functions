/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { execSync } from 'child_process';
import * as fs from 'fs';
import { cli } from 'cli-ux';
import fetch from 'node-fetch';
import sha256File = require('sha256-file');
const util = require('util');
const kbpgp = require('kbpgp');
const Benny = require('../benny.js');
const benny = new Benny();

// matching behavior of the evergreen-base (https://github.com/heroku/evergreen-base/blob/master/src/apollo-links/http.ts#L1-L2)
process.env.GLOBAL_AGENT_ENVIRONMENT_VARIABLE_NAMESPACE = '';
require('global-agent/bootstrap');

async function streamToFile(res: any, path: string) {
  return new Promise<void>((resolve, reject) => {
    if (res.status === 200) {
      const fileStream = fs.createWriteStream(path);
      res.body.pipe(fileStream);
      res.body.on('error', (err: Error) => reject(err));
      fileStream.on('finish', () => resolve());
    } else {
      reject(new Error(`Could not download file (${res.status}).`));
    }
  });
}

async function downloadFile(url: string, path: string, contentType: string) {
  const headers = { Accept: contentType };
  const response = await fetch(url, { headers, redirect: 'manual' });
  if (response.status === 302 || response.status === 301) {
    const redirectUrl = response.headers.get('location');
    if (redirectUrl) {
      const redirectResponse = await fetch(redirectUrl);
      return streamToFile(redirectResponse, path);
    }
  }
  return streamToFile(response, path);
}

function updateCacheVar(header: any, cache: { [key: string]: any }) {
  cache.etag = header.get('etag').toString();
  const maxage = Number(header.get('Cache-Control').toString().split('=')[1]);
  cache.expireAt = Date.now() + maxage * 1000;
}

async function streamToLatest(res: any, cache: { [key: string]: any }) {
  return new Promise((resolve, reject) => {
    if (res.status === 200) {
      const fileStream = fs.createWriteStream(benny.latestPath);
      res.body.pipe(fileStream);
      res.body.on('error', (err: Error) => reject(err));
      fileStream.on('finish', () => {
        updateCacheVar(res.headers, cache);
        resolve(res.status);
      });
    } else if (res.status === 304) {
      // not modified
      updateCacheVar(res.headers, cache);
      resolve(res.status);
    } else {
      reject(new Error(`Could not download latest file (${res.status}).`));
    }
  });
}

async function downloadLatest(cache: { [key: string]: any }) {
  const url = benny.latestUrl;
  if (process.env.DEBUG === '*') {
    process.stderr.write(`Downloading latest file from ${url}\n`);
  }
  const headers: { [key: string]: string } = {};
  headers.Accept = 'application/json';
  if (cache.etag !== '') {
    headers['If-None-Match'] = cache.etag;
  }
  const response = await fetch(url, { headers, redirect: 'manual' });
  if (response.status === 302 || response.status === 301) {
    const redirectUrl = response.headers.get('location');
    if (redirectUrl) {
      const redirectResponse = await fetch(redirectUrl);
      return streamToLatest(redirectResponse, cache);
    }
  }
  return streamToLatest(response, cache);
}

function parseVersion(): string {
  let output = execSync(`${benny.localPath} -version`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
  const arr = output.split(' ');
  output = arr[arr.length - 1].trim();
  return output;
}

function handleError(err: string, bennyExists: boolean) {
  if (!bennyExists) {
    cli.error(err);
  }
}

async function readCacheFile(path: string) {
  const readFile = util.promisify(fs.readFile);
  let str = '';
  if (fs.existsSync(path)) {
    try {
      str = await readFile(path, { encoding: 'utf8', flag: 'r' });
    } catch {}
  }
  return str;
}

async function readCache(cache: { [key: string]: any }) {
  cache.etag = await readCacheFile(benny.etagPath);
  cache.expireAt = Number(await readCacheFile(benny.expirePath));
  if (isNaN(cache.expireAt)) cache.expireAt = 0;
}

async function writeCache(cache: { [key: string]: any }) {
  const writeFile = util.promisify(fs.writeFile);
  try {
    await writeFile(benny.etagPath, cache.etag, 'utf8');
    await writeFile(benny.expirePath, cache.expireAt, 'utf8');
  } catch {}
}

async function deleteFile(path: string) {
  if (fs.existsSync(path)) {
    try {
      const unlink = util.promisify(fs.unlink);
      await unlink(path);
    } catch {}
  }
}

async function deleteCache() {
  await deleteFile(benny.etagPath);
  await deleteFile(benny.expirePath);
}

async function deleteBinary(bennyPath: string, version: string, bennyExists: boolean) {
  if (bennyExists) {
    if (process.env.DEBUG === '*') {
      process.stderr.write(`Deleting ${benny.name} binary ${version}\n`);
    }
    await deleteFile(bennyPath);
  }
}

async function deleteLatest() {
  await deleteFile(benny.latestPath);
  await deleteFile(benny.latestSigPath);
}

async function verifyGPG(msgPath: string, keyPath: string, sigPath: string) {
  const publicKeyArmored = fs.readFileSync(keyPath, 'utf8');
  const detachedSignature = fs.readFileSync(sigPath, 'utf8');
  const messageBinary = fs.readFileSync(msgPath);
  return new Promise<void>((resolve, reject) => {
    kbpgp.KeyManager.import_from_armored_pgp(
      {
        armored: publicKeyArmored,
      },
      function (err: Error, km: any) {
        if (err) {
          reject(new Error('Failed to load public key'));
        } else {
          const ring = new kbpgp.keyring.KeyRing();
          ring.add_key_manager(km);
          // verify detached signature
          kbpgp.unbox(
            {
              strict: false,
              armored: detachedSignature,
              data: messageBinary,
              keyfetch: ring,
            },
            (err: Error) => {
              if (err) {
                reject(new Error('Invalid latest file signature\n' + err));
              } else {
                resolve();
              }
            }
          );
        }
      }
    );
  });
}

function verifyChecksum(filepath: string, sha: string) {
  const checksum = sha256File(filepath);
  return checksum === sha;
}

async function updateBenny() {
  const cache: { [key: string]: any } = {
    etag: '',
    expireAt: 0,
  };
  let latestVersion = '';
  let currentVersion = '';
  const bennyPath = benny.localPath;
  let bennyExists = fs.existsSync(bennyPath);

  [benny.tmpDir, benny.binDir].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  });

  // obtain local benny version
  try {
    currentVersion = parseVersion();
    await readCache(cache);
    // within cache control max age, early termination
    if (Date.now() < cache.expireAt) {
      return;
    }
  } catch {
    // no or broken local binary
    await deleteCache();
    await deleteBinary(bennyPath, currentVersion, bennyExists);
    bennyExists = false;
  }

  // download latest file from S3 and verify signature
  try {
    // download latest file
    const status = await downloadLatest(cache);
    if (status === 304) {
      // cached, early termination
      await writeCache(cache);
      return;
    }
    // download latest.asc
    if (process.env.DEBUG === '*') {
      process.stderr.write('Downloading latest.asc\n');
    }
    await downloadFile(benny.latestSigUrl, benny.latestSigPath, 'text/plain');
    await verifyGPG(benny.latestPath, benny.publicKeyPath, benny.latestSigPath);
  } catch (error) {
    await deleteLatest();
    handleError(error, bennyExists);
    return;
  }

  // read latest version binary info from latest file
  const json = JSON.parse(fs.readFileSync(benny.latestPath, { encoding: 'utf8' }));
  const data = json[benny.majorVersion()][benny.os];
  latestVersion = data.version;

  if (latestVersion === currentVersion) {
    // has up-to-date local binary, not modified
    await writeCache(cache);
    return;
  }

  // download new binary from S3 and verify checksum
  try {
    const url = data.url;
    if (process.env.DEBUG === '*') {
      process.stderr.write(`Downloading latest ${benny.name} binary V-${latestVersion} from ${url}\n`);
    }
    await downloadFile(url, benny.tmpPath, 'application/octet-stream');
    const valid = verifyChecksum(benny.tmpPath, data.checksum);
    if (!valid) {
      throw new Error('Invalid benny binary checksum');
    }
  } catch (error) {
    await deleteBinary(benny.tmpPath, latestVersion, true);
    handleError(error, bennyExists);
    return;
  }

  // delete old binary
  await deleteBinary(bennyPath, currentVersion, bennyExists);
  // move new binary
  fs.renameSync(benny.tmpPath, bennyPath);
  fs.chmodSync(bennyPath, 0o765);
  // write etag header and cache only when download successfully
  await writeCache(cache);
}

export { updateBenny };
