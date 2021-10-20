module.exports = [
    {
        title: '首页', // 页面title
        template: './src/views/home/index.html', // html 模板
        filename: 'index.html', // 输出的名字 前面可加目录 
        chunks: ['index'], // 本页面独有chunks 提取的公共chunk 不用理会自动添加的
        index: './src/views/home/index.js' // 本页面配套的入口 js  入口 key 不能相同
    },
    {
        title: 'cart页面',
        template: './src/views/cart/cart.html',
        filename: 'views/cart.html',
        chunks: ['cart'],
        cart: './src/views/cart/cart.js'
    },
];
