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
    "node": "^16.0"
  },
  "scripts": {
    "build": "tsc",
    "lint": "eslint . --ext .ts --config .eslintrc",
    "test": "mocha",
    "watch": "tsc -w"
  },
  "devDependencies": {
    "@types/chai": "^4.2.18",
    "@types/chai-as-promised": "^7.1.4",
    "@types/mocha": "^8.2.2",
    "@types/node": "^15.0.2",
    "@types/sinon": "^10.0.0",
    "@typescript-eslint/eslint-plugin": "^4.23.0",
    "@typescript-eslint/parser": "^4.23.0",
    "chai": "^4.3.4",
    "eslint": "^6.8.0",
    "mocha": "^8.4.0",
    "sinon": "^10.0.0",
    "ts-node": "^9.1.1",
    "typescript": "^4.2.4"
  }
}
