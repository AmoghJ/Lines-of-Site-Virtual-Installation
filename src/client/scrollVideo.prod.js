const { merge } = require('webpack-merge');
const common = require('./scrollVideo.common.js');
const path = require('path');

module.exports = merge(common, {
    entry: './src/client/scrollVideo.ts',
    mode: 'production',
    performance: {
        hints: false
    },
    output: {
        filename: 'scrollVideo.js',
        path: path.resolve(__dirname, '../../dist/client'),
    } 
});