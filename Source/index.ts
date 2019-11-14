/*---------------------------------------------------------------------------------------------
*  Copyright (c) Dolittle. All rights reserved.
*  Licensed under the MIT License. See LICENSE in the project root for license information.
*--------------------------------------------------------------------------------------------*/

export * from './Webpack/webpack';
import webpack from 'webpack';
let x = {};
webpack(x as any, (_, stats) => {stats.toString()})