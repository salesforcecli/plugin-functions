{
  "name": "{{fnNameHyphened}}-function",
  "version": "0.0.1",
  "author": "TODO",
  "description": "TODO",
  "license": "UNLICENSED",
  "main": "dist/index.js",
  "repository": {
    "type": "git"
  },
  "engines": {
    "node": "^14.0"
  },
  "scripts": {
    "build": "tsc",
    "lint": "eslint . --ext .ts --config .eslintrc",
    "postinstall": "npm run build",
    "test": "node_modules/mocha/bin/mocha -r ts-node/register 'test/**/*.ts'",
    "watch-node": "nodemon dist/index.js",
    "watch": "tsc -w"
  },
  "dependencies": {
    "@salesforce/salesforce-sdk": "{{sfSdkVersion}}"
  },
  "devDependencies": {
    "@types/chai": "^4.1.7",
    "@types/chai-as-promised": "^7.1.0",
    "@typescript-eslint/eslint-plugin": "^2.23.0",
    "@typescript-eslint/parser": "^2.23.0",
    "@types/mocha": "^5.2.5",
    "@types/node": "^14.0.14",
    "@types/sinon": "^7.0.4",
    "chai": "^4.2.0",
    "eslint": "^6.7.2",
    "mocha": "^5.2.0",
    "sinon": "^7.2.3",
    "ts-node": "^8.7",
    "tslib": "^1.11.2",
    "typescript": "^3.8.3"
  }
}
