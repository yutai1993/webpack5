const {resolve, basename} = require('path');

const webpack = require('webpack');
//引入html模板插件
const HtmlWebpackPlugin = require('html-webpack-plugin');
// 删除 生产环境 dist目录中的内容
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
// css打包单独文件
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
// css压缩
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
// 压缩 js
const TerserWebpackPlugin = require('terser-webpack-plugin')
// 拷贝无需打包的静态资源
const CopyWebpackPlugin = require('copy-webpack-plugin');
// 打包svg 不写
const SpriteLoaderPlugin = require('svg-sprite-loader/plugin');

// HTML模板与入口数组
let pages = require('./pages');
let entryObj = {}; // 过滤出的入口

pages = pages.map(page => {
    for (const [key, value] of Object.entries(page)) {
        if (key !== 'title' && key !== 'template' && key !== 'filename' && key !== 'chunks') {
            entryObj[key] = value
        }
    }
    return new HtmlWebpackPlugin({
        template: page.template,//指定产出的html 模板
        filename: page.filename, // 产出的html 文件名
        title: page.title,
        hash: true,//哈希值 ，会在引入的js里加入查询字符串，避免缓存
        chunks: page.chunks, // 影响不到 optimization 里 的包 会自动加z
        minify: {
            removeAttributeQuotes: true, //压缩html文件，把属性双引号删除
            collapseWhitespace: true, //  移除空格
            removeComments: true  // 移除注释
        }
    })
})

module.exports = {

    mode: "production", // 模式：production 生产  development 开发

    devtool: 'cheap-module-source-map', // 错误代码追踪  | source-map 指向的原始代码生产环境禁用

    // 入口文件
    entry: entryObj,

    // 输出
    output: {
        path: resolve(__dirname, 'dist'), // 输出目录
        filename: `js/[name].[chunkhash:8].js`    // 输出的名字
    },
    /* 模块解析 */
    resolve: {
        alias: {
            "@": resolve('src')
        },
        extensions: ['.js', '.css', '.scss'],
    },

    // 规则
    module: {
        rules: [
            // 打包 css
            {
                test: /\.css$/i,
                use: [
                    // 提取成单独的文件
                    {
                        loader: MiniCssExtractPlugin.loader, // 提取成单独的文件
                    },
                    // 将css文件转换成commonjs模块加载js中，里面内容时样式字符串
                    {
                        loader: 'css-loader',
                        options: {importLoaders: 1,},
                    },
                    // 兼容
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [
                                    [
                                        'postcss-preset-env',
                                        {
                                            // 选项
                                        },
                                    ],
                                ],
                            },
                        },
                    }
                ]
            },

            // 打包 scss
            {
                test: /\.scss$/,
                use: [
                    // 提取成单独的文件
                    {
                        loader: MiniCssExtractPlugin.loader,
                    },
                    // 将css文件转换成commonjs模块加载js中，里面内容时样式字符串
                    {
                        loader: 'css-loader',
                        options: {importLoaders: 1,},
                    },
                    // 兼容
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [
                                    [
                                        'postcss-preset-env',
                                        {
                                            // 选项
                                        },
                                    ],
                                ],
                            },
                        },
                    },
                    // 编译scss
                    {
                        loader: 'sass-loader',
                    },
                    // 向每个scss文件注入全局变量
                    {
                        loader: 'sass-resources-loader',
                        options: { // 文件路径
                            resources: resolve(__dirname, './src/assets/css/index.scss')
                        }
                    }
                ]
            },

            // 打包 less
            {
                test: /\.less$/,
                use: [
                    // 提取成单独的文件
                    {
                        loader: MiniCssExtractPlugin.loader, // 提取成单独的文件
                    },
                    // 将css文件转换成commonjs模块加载js中，里面内容时样式字符串
                    {
                        loader: 'css-loader',
                        options: {importLoaders: 1,},
                    },
                    // 兼容
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [
                                    [
                                        'postcss-preset-env',
                                        {
                                            // 选项
                                        },
                                    ],
                                ],
                            },
                        },
                    },
                    {loader: 'less-loader'},
                ]
            },

            // 打包 js 如果要兼容 IE8 不要使用 es7
            // 兼容参考：https://github.com/zloirock/core-js/blob/master/README.md#supported-engines
            {
                test: /\.js$/i,
                exclude: /node_modules/,
                loader: 'babel-loader',
                options: {
                    presets: [
                        [
                            '@babel/preset-env',
                            {
                                useBuiltIns: 'usage',
                                corejs: { // 指定core-js版本
                                    version: 3
                                },
                                targets: {
                                    chrome: '60',
                                    firefox: '60',
                                    ie: '8',
                                    safari: '10',
                                    edge: '17'
                                }
                            }
                        ]
                    ],
                    // 开启 babel 缓存
                    // 第二次构建时，会尝试读取之前的缓存
                    //  cacheDirectory: true,
                }
            },


            // 打包 img
            {
                oneOf: [
                    {
                        test: /\.(jpg|png|gif|jpe?g|webp|svg)$/,
                        loader: "url-loader",
                        exclude: [resolve(__dirname, 'src/assets/icon/svg'), resolve(__dirname, 'src/assets/fonts')],
                        options: {
                            limit: 8 * 1024,
                            esModule: false,
                            name: "[hash:10].[ext]",
                            outputPath: 'images'
                        },
                        type: 'javascript/auto'
                    },
                    {  // 负责引入html img 从而能被url-loader处理
                        test: /\.html$/,
                        use: {
                            loader: 'html-loader',
                            options: {
                                sources: {
                                    list: [
                                        {
                                            tag: 'img',
                                            attribute: 'src',
                                            type: 'src',
                                        },
                                    ]
                                }
                            }
                        }
                    }
                ]
            },

            // 打包 vsg
            {
                test: /\.svg$/,
                include: [resolve(__dirname, 'src/assets/icon/svg')],
                use: [
                    {
                        loader: 'svg-sprite-loader',
                        options: {
                            spriteFilename: svgPath => `sprite${svgPath.substr(-4)}`,
                            extract: true, // 注意: 不写不打包
                            symbolId: 'icon-[name]',
                            outputPath: 'icon/svg/'
                        }

                    },
                    {
                        loader: "svgo-loader",
                        options: {
                            plugins: [
                                {
                                    name: 'removeAttrs',
                                    params: {
                                        attrs: 'fill'
                                    }
                                },
                            ]
                        }
                    }
                ],
            },

            //打包 icon 字体
            {
                test: /\.(ttf|eot|svg|woff|woff2)$/,
                exclude: [resolve(__dirname, 'src/assets/icon/svg'), resolve(__dirname, 'src/assets/images')],
                loader: 'file-loader',
                options: {
                    esModule: false,
                    name: 'icon/fonts/[name].[ext]'
                },
                type: "javascript/auto"
            },
        ]
    },

    // 插件
    plugins: [
        // 注入第三方框架（库）的全局变量
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery'
        }),
        // 打包 svg
        new SpriteLoaderPlugin({plainSprite: true}),
        // css打包成单独文件
        new MiniCssExtractPlugin({
            // 输出的文件名
            filename: 'css/[name].[chunkhash:8].css',

        }),
        // 配置 html模板
        ...pages,
        // 删除 生产环境 dist目录中的内容
        new CleanWebpackPlugin(),
        // 拷贝无需打包的静态资源
        new CopyWebpackPlugin({
            patterns: [
                {from: resolve(__dirname, 'public'), to: 'public'}
            ]
        })
    ],

    // 公共提取
    optimization: {
        minimizer: [
            // 压缩 js
            new TerserWebpackPlugin({
                test: /\.js(\?.*)?$/i,
                // 是否开启多进程  | number 并发次数
                // 打包时间不长 不建议开启
                //  parallel: true,
                minify: TerserWebpackPlugin.uglifyJsMinify,
                // `terserOptions` options will be passed to `uglify-js`
                // Link to options - https://github.com/mishoo/UglifyJS#minify-options
                terserOptions: {
                    ie8: true, // 不开启ie8会缺少标识符号
                    safari10: true,
                },
            }),
            // 压缩 css
            new CssMinimizerPlugin(),

        ],
        splitChunks: {
            // chunks: "all",
            cacheGroups: {
                // 注意: priority属性 0为最高优先级别 不建议使用 0
                // 请使用负整数设置优先级别 示例: -10 -20 -30

                // 单独打包 匹配的包
                // 例子：test: /[\\/]node_modules[\\/](jquery|react-dom)[\\/]/, 二包合一
                jquery: {
                    test: /[\\/]node_modules[\\/](jquery)[\\/]/,
                    name: 'jquery', // 打包后的包名
                    chunks: 'all',
                    priority: -10
                },
                // 打包node_modules中的文件
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: "vendor",
                    chunks: "all",
                    priority: -20
                },

                // 打包业务中公共代码
                common: {
                    test: /\.js$/i,
                    name: "common",
                    chunks: "initial",
                    minSize: 1, //生成 chunk 的最小体积（以 bytes 为单位）。
                    // minChunks: 2, // 最少被引用两次
                    priority: -30  // 优先级  0 为最高优先级
                }

            }
        }
    },


}