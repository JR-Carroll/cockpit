var path = require('path');

module.exports = {
  entry: ["./src/js/main.js", "./src/css/app.scss", "./src/css/main.css"],
  mode: "development",
  output: {
    filename: "./dist/bundle.js",
    path: path.resolve(__dirname, 'dist')
  },
  module: {
  	rules: [
  			{
				test: /\.js$/,
				loader: 'babel-loader',
				query: {
				presets: ['@babel/preset-env'],
				}
			},
			{	
				test: /\.scss$/,
				use: [
				  {
				    loader: 'file-loader',
				    options: {
				      name: './dist/bundle.css',
				    },
				  },
				  { loader: 'extract-loader' },
				  { loader: 'css-loader' },
				  {loader: 'sass-loader',
				   options: {
				   sassOptions: {
				   includePaths: ['./node_modules']}}}
					]
			},
			{	
				test: /\.css$/,
				use: [
				  {
				    loader: 'file-loader',
				    options: {
				      name: './dist/bundle2.css',
				    },
				  },
				  { loader: 'extract-loader' },
				  { loader: 'css-loader' },
				  {loader: 'sass-loader',
				   options: {
				   sassOptions: {
				   includePaths: ['./node_modules']}}}
					]
			}]
		}
	};