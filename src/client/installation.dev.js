const { merge } = require('webpack-merge');
const common = require('./installation.common.js');
const path = require('path');

module.exports = merge(common, {
    entry: './src/client/threejsInstallation.ts',
    mode: 'development',
    devtool: 'eval-source-map',
    devServer: {
        contentBase: './dist/client',
        hot: true,
    },
    output: {
        filename: 'threejsInstallation.js',
        path: path.resolve(__dirname, '../../dist/client'),
    }
});