const merge = require('webpack-merge');
const common = require('./webpack.common')

module.exports = merge(common, {
    output: {
        filename: "bundle.min.js",
        path: __dirname + "/dist.prod"
    },
    mode : 'production'
});
