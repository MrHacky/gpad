const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const webpack = require('webpack');

module.exports = {
	entry: [
		'./src/index.tsx'
	],
	devServer: {
		contentBase: './dist',
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
			{ test: /\.tsx?$/, loaders: ["awesome-typescript-loader"] },
			// All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
			{ enforce: "pre", test: /\.js$/, loader: "source-map-loader" }
		]
	},
	plugins: [
		new CleanWebpackPlugin(['dist']),
		new webpack.NamedModulesPlugin(),
		/*
		new webpack.DefinePlugin({
			'process.env': {
				'NODE_ENV': '"production"',
			},
		}),
		new webpack.optimize.ModuleConcatenationPlugin(),
		new UglifyJsPlugin(),
		*/
		new HtmlWebpackPlugin({
			title: 'Hello World'
		})
	],
	output: {
		filename: '[name].bundle.js',
		path: path.resolve(__dirname, 'dist')
	}
};
