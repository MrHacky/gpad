const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
//const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { GitRevisionPlugin } = require('git-revision-webpack-plugin');

const webpack = require('webpack');

const gitRevisionPlugin = new GitRevisionPlugin()

module.exports = {
	mode: 'production',
	entry: [
		'./src/index.tsx'
	],
	devServer: {
		static: './dist',
		port: 8000
	},
	resolve: {
		// Add '.ts' and '.tsx' as resolvable extensions.
		extensions: [".ts", ".tsx", ".js", ".json"],
	},
	devtool: "source-map",
	module: {
		rules: [
			// All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
			{ test: /\.tsx?$/, loader: "awesome-typescript-loader" },
			// All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
			{ enforce: "pre", test: /\.js$/, loader: "source-map-loader" }
		]
	},
	plugins: [
		new webpack.DefinePlugin({
			COMMITHASH: webpack.DefinePlugin.runtimeValue(() => JSON.stringify(gitRevisionPlugin.commithash())),
		}),
		//new CleanWebpackPlugin(['dist']),
		new CopyWebpackPlugin({ patterns: [{ from: 'public', to: '.' }] }),
		/*
		new webpack.NamedModulesPlugin(),
		new webpack.optimize.ModuleConcatenationPlugin(),
		new UglifyJsPlugin(),
		*/
		new HtmlWebpackPlugin({
			title: 'gPad'
		}),
	],
	output: {
		filename: '[name].bundle.js',
		path: path.resolve(__dirname, 'dist')
	}
};
