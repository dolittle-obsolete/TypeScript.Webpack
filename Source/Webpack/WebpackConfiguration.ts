/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Dolittle. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import {
    Configuration,
    Output,
    Resolve,
    Options,
    Module,
    Plugin,
    ProvidePlugin
} from 'webpack';
import fs from 'fs';
import path from 'path';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import DuplicatePackageChecker from 'duplicate-package-checker-webpack-plugin';

import { WebpackEnvironment } from './WebpackEnvironment';
import { WebpackArguments } from './WebpackArguments';

const ensureArray = (config: any) =>
    (config && (Array.isArray(config) ? config : [config])) || [];
const when = (condition: boolean, config: any, negativeConfig?: any) =>
    condition ? ensureArray(config) : ensureArray(negativeConfig);

export class WebpackConfiguration {
    private _cssRules = [{ loader: 'css-loader' }];
    private _scssRules = [
        'css-loader',
        {
            loader: 'postcss-loader',
            options: {
                plugins: () => [require('autoprefixer')()]
            }
        },
        'sass-loader'
    ];

    private _featuresDir = process.env.DOLITTLE_FEATURES_DIR || './Features';
    private _componentDir =
        process.env.DOLITTLE_COMPONENT_DIR || './Components';

    private _outDir =
        process.env.DOLITTLE_WEBPACK_OUT ||
        path.resolve(this._rootDir, 'wwwroot');
    private _title = process.env.DOLITTLE_WEB_TITLE || '';
    private _baseUrl = process.env.DOLITTLE_WEBPACK_BASE_URL || '/';
    private _args: WebpackArguments = {
        server: false,
        extractCss: false,
        analyze: false
    };

    constructor(
        private _rootDir: string,
        private _environment: WebpackEnvironment,
        private _argv: string[]
    ) {
        this._argv.forEach(element => {
            switch (element) {
                case '--extractCss':
                    this._args.extractCss = true;
                    break;
                case '--env.production':
                    this._environment.production = true;
                    break;
                case '--analye':
                    this._args.analyze = true;
                    break;
            }
        });
    }

    createConfiguration(): Configuration {
        let config: Configuration = {};
        config.mode = this._environment.production
            ? 'production'
            : 'development';
        config.context = this._rootDir;
        config.target = 'web';
        (config as any).devServer = {
            historyApiFallback: true,
            proxy: {
                '/api': 'http://localhost:5000'
            }
        };
        config.optimization = this.getOptimization();
        config.resolve = this.getResolve();
        config.entry = this.getEntry();
        config.output = this.getOutput();
        config.performance = this.getPerformance();
        config.devtool = this.getDevtool();
        config.module = this.getModule();
        config.plugins = this.getPlugins();
        return config;
    }
    private getResolve() {
        let resolve: Resolve = {
            symlinks: false,
            mainFields: ['main'],
            extensions: ['.ts', '.js'],
            modules: [
                path.resolve(this._featuresDir),
                path.resolve(this._componentDir),
                'node_modules'
            ],
            alias: {
                DolittleStyles: path.resolve(this._rootDir, 'Styles')
            }
        };
        return resolve;
    }
    private getEntry() {
        return fs.existsSync(path.resolve(this._featuresDir, 'main.ts'))
            ? path.resolve(this._featuresDir, 'main.ts')
            : path.resolve(this._featuresDir, 'main.js');
    }

    private getOutput() {
        let output: Output = {
            filename:
                this._environment.production === true
                    ? '[name].[chunkhash].bundle.js'
                    : '[name].[hash].bundle.js',
            sourceMapFilename:
                this._environment.production === true
                    ? '[name].[chunkhash].bundle.map'
                    : '[name].[hash].bundle.map',
            chunkFilename:
                this._environment.production === true
                    ? '[name].[chunkhash].chunk.js'
                    : '[name].[hash].chunk.js',
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
        let devtool: any = !this._environment.production
            ? 'inline-source-map'
            : '';
        return devtool;
    }

    private getModule() {
        let module: Module = {
            rules: [
                // Styles
                {
                    // CSS required in JS/TS files should use the style-loader that auto-injects it into the website
                    // only when the issuer is a .js/.ts file, so the loaders are not applied inside html templates
                    test: /\.css$/i,
                    issuer: [{ not: [{ test: /\.html$/i }] }],
                    use: this._args.extractCss
                        ? [
                              {
                                  loader: MiniCssExtractPlugin.loader
                              },
                              ...this._cssRules
                          ]
                        : ['style-loader', ...this._cssRules]
                },
                {
                    test: /\.css$/i,
                    issuer: [{ test: /\.html$/i }],
                    use: this._args.extractCss
                        ? [
                              {
                                  loader: MiniCssExtractPlugin.loader
                              },
                              ...this._cssRules
                          ]
                        : this._cssRules
                },
                {
                    test: /\.scss$/,
                    issuer: /\.[tj]s$/i,
                    use: this._args.extractCss
                        ? [
                              {
                                  loader: MiniCssExtractPlugin.loader
                              },
                              ...this._scssRules
                          ]
                        : ['style-loader', ...this._scssRules]
                },
                {
                    test: /\.scss$/,
                    issuer: /\.html?$/i,
                    use: this._args.extractCss
                        ? [
                              {
                                  loader: MiniCssExtractPlugin.loader
                              },
                              ...this._scssRules
                          ]
                        : this._scssRules
                },
                //html
                { test: /\.html$/i, loader: 'html-loader' },
                // Source files
                {
                    test: /\.[tj]s$/i,
                    exclude: /(node_modules|bower_components)/,
                    loader: 'ts-loader'
                },
                // embed small images and fonts as Data Urls and larger ones as files:
                {
                    test: /\.(png|gif|jpg|cur)$/i,
                    loader: 'url-loader',
                    options: { limit: 8192 }
                },
                {
                    test: /\.woff2(\?v=[0-9]\.[0-9]\.[0-9])?$/i,
                    loader: 'url-loader',
                    options: {
                        limit: 10000,
                        mimetype: 'application/font-woff2'
                    }
                },
                {
                    test: /\.woff(\?v=[0-9]\.[0-9]\.[0-9])?$/i,
                    loader: 'url-loader',
                    options: { limit: 10000, mimetype: 'application/font-woff' }
                },
                // load these fonts normally, as files:
                {
                    test: /\.(ttf|eot|svg|otf)(\?v=[0-9]\.[0-9]\.[0-9])?$/i,
                    loader: 'file-loader',
                    options: {
                        esModule: false
                    }
                },
                {
                    test: /environment\.json$/i,
                    use: [
                        {
                            loader: 'app-settings-loader',
                            options: {
                                env:
                                    this._environment.production === true
                                        ? 'production'
                                        : 'development'
                            }
                        }
                    ]
                }
            ]
        };
        return module;
    }

    private getPlugins() {
        let plugins: Plugin[] = [
            new DuplicatePackageChecker(),
            new CleanWebpackPlugin({
                dangerouslyAllowCleanPatternsOutsideProject: true,
                dry: false,
                cleanStaleWebpackAssets: false,
                cleanOnceBeforeBuildPatterns: ['**/*.*']
            }),
            new ProvidePlugin({
                Promise: ['es6-promise']
            }),
            // new WatchIgnorePlugin(['**/for_*']),
            new HtmlWebpackPlugin({
                minify: this._environment.production
                    ? {
                          removeComments: true,
                          collapseWhitespace: true
                      }
                    : undefined,
                template: fs.existsSync(
                    path.resolve(this._rootDir, 'index.ejs')
                )
                    ? path.resolve(this._rootDir, 'index.ejs')
                    : path.resolve(this._rootDir, 'index.html'),
                metadata: {
                    // available in index.ejs //
                    title: this._title,
                    baseUrl: this._baseUrl
                }
            }),
            ...when(
                this._args.extractCss === true,
                new MiniCssExtractPlugin({
                    // updated to match the naming conventions for the js files
                    filename:
                        this._environment.production === true
                            ? 'css/[name].[contenthash].bundle.css'
                            : 'css/[name].[hash].bundle.css',
                    chunkFilename:
                        this._environment.production === true
                            ? 'css/[name].[contenthash].chunk.css'
                            : 'css/[name].[hash].chunk.css'
                })
            ),
            ...when(this._args.analyze!, new BundleAnalyzerPlugin())
        ];
        return plugins;
    }

    private getOptimization() {
        let optimization: Options.Optimization = {
            runtimeChunk: true, // separates the runtime chunk, required for long term cacheability
            // moduleIds is the replacement for HashedModuleIdsPlugin and NamedModulesPlugin deprecated in https://github.com/webpack/webpack/releases/tag/v4.16.0
            // changes module id's to use hashes be based on the relative path of the module, required for long term cacheability
            moduleIds: 'hashed',
            // Use splitChunks to breakdown the App/Aurelia bundle down into smaller chunks
            // https://webpack.js.org/plugins/split-chunks-plugin/
            splitChunks: {
                chunks: 'initial',
                // sizes are compared against source before minification
                maxSize: 200000, // splits chunks if bigger than 200k, adjust as required (maxSize added in webpack v4.15)
                cacheGroups: {
                    default: false, // Disable the built-in groups default & vendors (vendors is redefined below)
                    // You can insert additional cacheGroup entries here if you want to split out specific modules
                    // This is required in order to split out vendor css from the app css when using --extractCss
                    // For example to separate font-awesome and bootstrap:
                    // fontawesome: { // separates font-awesome css from the app css (font-awesome is only css/fonts)
                    //   name: 'vendor.font-awesome',
                    //   test:  /[\\/]node_modules[\\/]font-awesome[\\/]/,
                    //   priority: 100,
                    //   enforce: true
                    // },
                    // bootstrap: { // separates bootstrap js from vendors and also bootstrap css from app css
                    //   name: 'vendor.font-awesome',
                    //   test:  /[\\/]node_modules[\\/]bootstrap[\\/]/,
                    //   priority: 90,
                    //   enforce: true
                    // },

                    // This is the HTTP/1.1 optimised cacheGroup configuration
                    vendors: {
                        // picks up everything from node_modules as long as the sum of node modules is larger than minSize
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        priority: 19,
                        enforce: true, // causes maxInitialRequests to be ignored, minSize still respected if specified in cacheGroup
                        minSize: 30000 // use the default minSize
                    },
                    vendorsAsync: {
                        // vendors async chunk, remaining asynchronously used node modules as single chunk file
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors.async',
                        chunks: 'async',
                        priority: 9,
                        reuseExistingChunk: true,
                        minSize: 10000 // use smaller minSize to avoid too much potential bundle bloat due to module duplication.
                    },
                    commonsAsync: {
                        // commons async chunk, remaining asynchronously used modules as single chunk file
                        name: 'commons.async',
                        minChunks: 2, // Minimum number of chunks that must share a module before splitting
                        chunks: 'async',
                        priority: 0,
                        reuseExistingChunk: true,
                        minSize: 10000 // use smaller minSize to avoid too much potential bundle bloat due to module duplication.
                    }
                }
            }
        };
        return optimization;
    }
}
