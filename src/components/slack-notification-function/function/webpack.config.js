const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'index.js',
        library: {
            type: 'commonjs2',
        },
        clean: true,
    },
    target: 'node',
    // https://github.com/aws/aws-sdk-js-v3/issues/2885
    externals: ['aws-crt'],
};
