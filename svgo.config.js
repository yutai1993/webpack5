module.exports = {
    plugins: [
        {
            name: 'removeAttrs',
            params:{
                attrs: 'fill'
            }
        },
        {name: 'removeDoctype'},
        {name: 'removeXMLProcInst'}
    ]
};