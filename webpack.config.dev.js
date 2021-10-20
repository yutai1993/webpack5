const {resolve} = require('path');
// 内置插件
const  webpack = require('webpack');
//引入html模板插件
const HtmlWebpackPlugin = require('html-webpack-plugin');
// 删除 生产环境 dist目录中的内容
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
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
    mode: "development", // 模式：production 生产  development 开发

    devtool: 'eval-cheap-module-source-map', // 错误代码追踪

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

    module: {
        rules: [
            // 打包css
            {
                test: /\.css$/i,
                use: [
                    // 多个loader执行顺序 数组从中右到左依次执行
                    //创建style标签，将js中样式资源插入到head标签中
                    'style-loader',
                    // 将css文件转换成commonjs模块加载js中，里面内容时样式字符串
                    'css-loader'
                ]
            },

            // 打包scss
            {
                test: /\.scss$/,
                use: [
                    //创建style标签，将js中样式资源插入到head标签中
                    {
                        loader: 'style-loader',
                    },
                    // 将css文件转换成commonjs模块加载js中，里面内容时样式字符串
                    {
                        loader: 'css-loader',
                        options: {importLoaders: 1,},
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

            // 打包less
            {
                test: /\.less$/,
                use: [
                    // 多个loader执行顺序 数组从中右到左依次执行
                    //创建style标签，将js中样式资源插入到head标签中
                    'style-loader',
                    // 将css文件转换成commonjs模块加载js中，里面内容时样式字符串
                    'css-loader',
                    'less-loader'
                ]
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
                                    params:{
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

    plugins: [
        // 第三方框架(库)变量注入(内置插件)
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery'
        }),
        // 打包 svg
        new SpriteLoaderPlugin({ plainSprite: true }),
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

    optimization: {
        splitChunks: {
            cacheGroups: {

                // 单独打包 匹配的包
                // 例子：test: /[\\/]node_modules[\\/](jquery|react-dom)[\\/]/, 二包合一
                jquery: {
                    test: /[\\/]node_modules[\\/](jquery)[\\/]/,
                    name: 'jquery', // 打包后的包名
                    chunks: 'all',
                    priority: -10   // 次之
                },
                // 首先: 打包node_modules中的文件
                vendor: {
                    name: "vendor",
                    test: /[\\/]node_modules[\\/]/,
                    chunks: "all",
                    priority: -20
                },
                // 注意: priority属性
                // 打包业务中公共代码
                common: {
                    name: "common",
                    chunks: "initial",
                    minSize: 1, //生成 chunk 的最小体积（以 bytes 为单位）。
                    // minChunks: 2, // 最少被引用两次
                    priority: -30  // 优先级  0 为最高优先级
                }

            }
        }
    },

    // 配置此静态服务器，可以用来预览打包后项目(打包到内存)
    devServer: {
        static: {
            directory: resolve(__dirname, 'dist') // 目录
        },
        host: 'localhost', // 域名
        port: 8080, // 端口
        compress: true, //服务器返回给浏览器的时候是否启用Gzip压缩
        open: true, // 自动打开浏览器
        hot: true, // 开启HRM功能 模块热替换
    }

}