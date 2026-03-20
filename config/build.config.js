const path = require('path');
const nodeExternals = require('webpack-node-externals');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
	mode: 'production',
	entry: './index.js',
	output: {
		filename: 'index.es5.js',
		path: path.resolve(__dirname, '..'),
		libraryTarget: 'commonjs2',
	},
	resolve: {
		modules: ['node_modules'],
		extensions: ['.js'],
	},
	module: {
		rules: [{
			test: /\.js$/,
			use: 'babel-loader',
			exclude: /node_modules/,
		}],
	},
	optimization: {
		minimizer: [new TerserPlugin()],
	},
	target: 'node',
	externals: [nodeExternals(), /^react(-router)?/],
};