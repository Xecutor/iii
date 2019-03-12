const merge = require('webpack-merge');
const common = require('./webpack.common')

module.exports = merge(common, {
    output: {
        filename: "bundle.js",
        path: __dirname + "/dist.dev"
    },
    mode : 'development',
    devtool: "source-map",

});
