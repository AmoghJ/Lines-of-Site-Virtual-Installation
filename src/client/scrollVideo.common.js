/*const path = require('path');

module.exports = {
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        alias: {
            three: path.resolve('./node_modules/three')
        },
        extensions: ['.tsx', '.ts', '.js'],
    }
};*/
const path = require('path');

module.exports = {
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
        rules: [
            {
              test: /\.(glsl|vs|fs)$/,
              loader: 'ts-shader-loader',
              exclude: /node_modules/,
            }
          ]
    },
    resolve: {
        alias: {
            three: path.resolve('./node_modules/three')
        },
        extensions: ['.tsx', '.ts', '.js'],
        fallback: {
          "fs": false,
          "tls": false,
          "net": false,
          "path": false,
          "zlib": false,
          "http": false,
          "https": false,
          "stream": false,
          "crypto": false,
          "buffer": false,
          "console":false,
          "crypto-browserify": require.resolve('crypto-browserify'), //if you want to use this module also don't forget npm i crypto-browserify 
        }, 
    },
};