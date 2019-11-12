/*---------------------------------------------------------------------------------------------
*  Copyright (c) Dolittle. All rights reserved.
*  Licensed under the MIT License. See LICENSE in the project root for license information.
*--------------------------------------------------------------------------------------------*/
import { Configuration, Output, Resolve, Options, Module, Plugin, WatchIgnorePlugin, HotModuleReplacementPlugin  } from "webpack";
import fs from "fs";
import path from 'path';
import {CleanWebpackPlugin} from 'clean-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import {BundleAnalyzerPlugin} from 'webpack-bundle-analyzer';

import { WebpackEnvironment } from "./WebpackEnvironment";

var BrotliPlugin = require('brotli-webpack-plugin');

const ensureArray = (config: any) => config && (Array.isArray(config)? config : [config]) || [];
const when = (condition: boolean, config: any, negativeConfig?: any) => condition? ensureArray(config) : ensureArray(negativeConfig);

export class WebpackConfiguration implements Configuration {
    
    private _featuresDir = process.env.DOLITTLE_FEATURES_DIR || './Features';
    private _componentDir = process.env.DOLITTLE_COMPONENT_DIR || './Components';


    private _outDir = process.env.DOLITTLE_WEBPACK_OUT || path.resolve(this._rootDir, 'wwwroot')
    private _title = process.env.DOLITTLE_WEB_TITLE || '';
    private _baseUrl = process.env.DOLITTLE_WEBPACK_BASE_URL || '/';


    constructor(private _rootDir: string, private _environment: WebpackEnvironment) {
        this.mode = _environment.production? 'production' : this.mode;
        if (_environment.production) {
            this.devtool
            this.optimization = {
                splitChunks: {
                    cacheGroups: {
                        commons: {
                            test: /[\\/]node_modules[\\/]/,
                            name: 'vendors',
                            chunks: 'all' 
                        }
                    }
                }
            };
        }
    }
    
    mode: 'development' | 'production' = 'development';
    context = this._rootDir;
    target: any = 'web';
    devServer = {
        historyApiFallback: true,
        proxy: {
            '/api': 'http://localhost:5000'
        }
    };
    resolve: Resolve = {
        symlinks: false,
        extensions: ['.ts', '.js'],
        modules: [path.resolve(this._featuresDir), path.resolve(this._componentDir), 'node_modules'],
        alias: {
            DolittleStyles: path.resolve(this._rootDir, './styles') 
        }
    };
    entry = fs.existsSync(path.resolve(this._rootDir, 'main.ts'))? path.resolve(this._rootDir, 'main.ts') : path.resolve(this._rootDir, 'main.js');
    output: Output = {
        filename: this.mode === 'production'? '[name].[chunkhash].bundle.js' : '[name].[hash].bundle.js',
        sourceMapFilename: this.mode === 'production' ? '[name].[chunkhash].bundle.map' : '[name].[hash].bundle.map',
        chunkFilename: this.mode === 'production' ? '[name].[chunkhash].chunk.js' : '[name].[hash].chunk.js',
        path: this._outDir,
        publicPath: this._baseUrl
    };
    performance: Options.Performance = {
        hints: false
    };
    devtool: any = this.mode === 'development' ? 'inline-source-map' : '';
    module: Module = {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
                issuer: /\.[tj]s$/i
            },
            {
                test: /\.css$/,
                use: ['css-loader'],
                issuer: /\.html?$/i
            },
            {
                test: /\.scss$/,
                use: [
                    'style-loader',
                    'css-loader',
                    {
                        loader: 'postcss-loader',
                        options: {
                            plugins: () => [require('autoprefixer')()]
                        }
                    },
                    'sass-loader'
                ],
                issuer: /\.[tj]s$/i
            },
            {
                test: /\.scss$/,
                use: [
                    'css-loader',
                    {
                        loader: 'postcss-loader',
                        options: {
                            plugins: () => [require('autoprefixer')()]
                        }
                    },
                    'sass-loader'
                ],
                issuer: /\.html?$/i
            },
            { test: /\.html$/i, loader: 'html-loader' },
            {
                test: /\.[tj]s$/i,
                exclude: /(node_modules|bower_components)/,
                loader: 'ts-loader',
            }
        ]
    };

    plugins: Plugin[] = [
        new CleanWebpackPlugin(),
        new WatchIgnorePlugin(['**/for_*']),
        new HtmlWebpackPlugin({
            minify: this._environment.production? {
                removeComments: true,
                collapseWhitespace: true
            } : undefined,
            template: fs.existsSync(path.resolve(this._rootDir, 'index.ejs'))?
                path.resolve(this._rootDir, 'index.ejs')
                : path.resolve(this._rootDir, 'index.html'),
            meta: {
                title: this._title,
                server: this._environment.server,
                baseUrl: this._baseUrl
            }
        }),
        ...when(this._environment.production!, new HotModuleReplacementPlugin()),
        ...when(this._environment.extractCss!, new ExtractTextPlugin({
            filename: this.mode === 'production'? '[contenthash].css' : '[id].css',
            allChunks: true
        })),
        ...when(this._environment.analyze!, new BundleAnalyzerPlugin()),
        ...when(this._environment.production!, new BrotliPlugin({
            asset: '[path].br[query]',
			test: /\.(ts|js|css|html|svg)$/,
			threshold: 10240,
			minRatio: 0.8
        }))

    ];
    optimization?: Options.Optimization 
}
