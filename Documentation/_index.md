---
title: Webpack
description: Learn about our pre-configured webpack for TypeScript
keywords: Tools, typescript, webpack
author: woksin
weight: 1
repository: https://github.com/dolittle-tools/TypeScript.Webpack
aliases: /tooling/typescript/webpack
---

This [package](https://npmjs.org/package/@dolittle/typescript.webpack) pre-configures a setup for webpack that is designed to work with most projects. It also stands as a fundamental building block for providing more custom-tailored configurations. [For example for Aurelia](https://npmjs.org/package/@dolittle/typescript.webpack.aurelia).


To use it you simply have a file called 'webpack.config.js' in the root of the package:
```javascript
const webpack = require('@dolittle/typescript.webpack').webpack
const config = webpack(__dirname);

module.exports = config;
```

You can also provide a callback for post-configuring the configuration
```javascript
const webpack = require('@dolittle/typescript.webpack').webpack
const config = webpack(__dirname, config => {});

module.exports = config;
```

## Project structure
There are a couple of conventions in the webpack configuration.

A couple of constants can be set by setting environment variables: 
```typescript
const featuresDir = process.env.DOLITTLE_FEATURES_DIR || './Features';
const componentDir = process.env.DOLITTLE_COMPONENT_DIR || './Components';

const outDir = process.env.DOLITTLE_WEBPACK_OUT || path.resolve(this._rootDir, 'wwwroot')
const title = process.env.DOLITTLE_WEB_TITLE || '';
const baseUrl = process.env.DOLITTLE_WEBPACK_BASE_URL || '/';
```
* 'featuresDir' and 'componentDir' are directories in the root of the project which has the actual source code, the webpack modules.
* 'outDIr' is the output directory of the webpacked files

You can configure those constants yourself:
```javascript
const path = require('path');

process.env.DOLITTLE_FEATURES_DIR = 'src';
process.env.DOLITTLE_WEBPACK_OUT = path.resolve(__dirname, 'dist');
const webpack = require('@dolittle/typescript.webpack').webpack
const config = webpack(__dirname, config => {});

module.exports = config;
```

The entry file should be called 'main.ts' or 'main.js' and should be located at the root of the 'featuresDir'
