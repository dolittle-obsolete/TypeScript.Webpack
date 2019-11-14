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

export class WebpackConfiguration {
    
    private _featuresDir = process.env.DOLITTLE_FEATURES_DIR || './Features';
    private _componentDir = process.env.DOLITTLE_COMPONENT_DIR || './Components';


    private _outDir = process.env.DOLITTLE_WEBPACK_OUT || path.resolve(this._rootDir, 'wwwroot')
    private _title = process.env.DOLITTLE_WEB_TITLE || '';
    private _baseUrl = process.env.DOLITTLE_WEBPACK_BASE_URL || '/';


    constructor(private _rootDir: string, private _environment: WebpackEnvironment) {}

    createConfiguration(): Configuration {
        let config: Configuration = {};
        config.mode = this._environment.production? 'production' : 'development';
        config.context = this._rootDir
        config.target = 'web';
        (config as any).devServer = {
            historyApiFallback: true,
            proxy: {
                '/api': 'http://localhost:5000'
            }
        };
        config.optimization = this.getOptimization()
        config.resolve = this.getResolve();
        config.entry = this.getEntry();
        config.output = this.getOutput();
        config.performance = this.getPerformance();
        config.devtool = this.getDevtool();
        config.module = this.getModule();
        config.plugins = this.getPlugins();
        return config;

    }
    private getOptimization() {
        let optimization = {};
        if (this._environment.production) {
            optimization = {
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
        return optimization;
    }
    private getResolve() {
        let resolve: Resolve = {
            symlinks: false,
            extensions: ['.ts', '.js'],
            modules: [path.resolve(this._featuresDir), path.resolve(this._componentDir), 'node_modules'],
            alias: {
                DolittleStyles: path.resolve(this._rootDir, './styles') 
            }
        };
        return resolve;
    }
    private getEntry() {
        return fs.existsSync(path.resolve(this._rootDir, 'main.ts'))? path.resolve(this._rootDir, 'main.ts') : path.resolve(this._rootDir, 'main.js');
    }

    private getOutput() {
        let output: Output = {
            filename: this._environment.production === true? '[name].[hash].bundle.js' : '[name].[hash].bundle.js',
            sourceMapFilename: this._environment.production === true ? '[name].[hash].bundle.map' : '[name].[hash].bundle.map',
            chunkFilename: this._environment.production === true ? '[name].[hash].chunk.js' : '[name].[hash].chunk.js',
            path: this._outDir,
            publicPath: this._baseUrl
        };
        return output;
    }
    private getPerformance() {
        let performance: Options.Performance = {
            hints: false
        };
        return performance;
    }

    private getDevtool() {
        let devtool: any = !this._environment.production ? 'inline-source-map' : '';
        return devtool;
    }
    
    private getModule() {
        let module: Module = {
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
        return module;
    }
    
    private getPlugins() {
        let plugins: Plugin[] = [
            new CleanWebpackPlugin(),
            // new WatchIgnorePlugin(['**/for_*']),
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
                filename: this._environment.production === true? '[contenthash].css' : '[id].css',
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
        return plugins;
    }

    
    optimization?: Options.Optimization 
}
