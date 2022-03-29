<div align="center">
  <img src="https://avatars2.githubusercontent.com/u/61063724?s=200&v=4" width="100px">
</div>

<br />

<div align="center">
  <h1>@soufantech/node-ts-lib-boilerplate</h1>
  <p>SouFan's TypeScript boilerplate for Node.js libraries</p>
</div>

<br />

<div align="center">

[![typescript-image]][typescript-url] [![jest-image]][jest-url] [![npm-image]][npm-url]

</div>

## Setup

1. Make a shallow clone of this project in the desired folder, renaming it (replace `<MY_LIB_NAME>` in any of the examples below for your project's name):
  - Using SSH: `git clone --depth 1 git@github.com:soufantech/node-ts-lib-boilerplate.git <MY_LIB_NAME>`.
  - Using HTTPS: `git clone --depth 1 https://github.com/soufantech/node-ts-lib-boilerplate.git <MY_LIB_NAME>`.
2. Step into the recently cloned project and erase the .git directory completely.
3. Make the required and optional overrides as described further below.
4. Create a new repository with `git init` and commit your files.

### **Required** overrides:

You **must**...

1. update `author`, `repository`, `homepage`, `bugs`, `name` and `version` fields in `package.json`.
2. delete or replace demo files: `rm src/index.ts src/simple-math.ts src/__tests__/simple-math.test.ts`.
3. rewrite this `README.md` (after reading it);

### **Optional** overrides:

You might want to...

- set the `license` field (default is `UNLICENSED`). You may also include a `LICENSE` file on the root folder.
- set the `publishConfig.access`to `public` if your package is not meant to be published as a private package.
- set the `private` field to `false` in order to publish the package.
- set the `repository` field.
- remove the `test` command along with the `jest` dependency if your project is not meant to include automated tests.
- run `yarn upgrade --latest` to generate a fresh `yarn.lock` and upgrade all dependencies listed in your `package.json`.
- exclude the `.npmrc` file or modify it if you're not using a SouFan NPM registry token (typically `SOUFAN_NPM_TOKEN`)

In addition to `package.json`, you might also want to check...

- the `.npmignore` file for the files that will be ignored on publishing.
- the test runner options on the `jest.config.js` file.
- the linter rules in the `eslintrc.yml` file.
- the general editor configuration on the `.editorconfig` file.

---

<div align="center">
  <sub>Built with ❤︎ by <a href="https://soufan.com.br">SouFan</a></sub>
</div>

[typescript-image]: https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript
[typescript-url]: "typescript"

[npm-image]: https://img.shields.io/npm/v/@soufantech/node-ts-lib-boilerplate.svg?style=for-the-badge&logo=npm
[npm-url]: https://npmjs.org/package/@soufantech/node-ts-lib-boilerplate "npm"

[jest-image]: https://img.shields.io/badge/tested_with-jest-99424f.svg?style=for-the-badge&logo=jest
[jest-url]: https://github.com/facebook/jest "jest"
