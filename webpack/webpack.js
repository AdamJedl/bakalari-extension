const webpack = require("webpack");
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const srcDir = path.join(__dirname, "..", "src");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const JsonMinimizerPlugin = require("json-minimizer-webpack-plugin");

module.exports = env => ({
    entry: {
        content_script: path.join(srcDir, "content-script.ts"),
        content_script_2: path.join(srcDir, "content-script-2.ts")
    },
    output: {
        path: path.join(__dirname, env.browser === "chrome" ? "../dist/js" : "../dist-firefox/js"),
        filename: "[name].js"
    },
    optimization: {
        minimizer: [`...`, new CssMinimizerPlugin(), new JsonMinimizerPlugin()]
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'esbuild-loader'
            },
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, "css-loader"]
            },
            {
                test: /\.json$/,
                type: "asset/resource"
            }
        ]
    },
    plugins: [
        new CopyPlugin({
            patterns: env.all ? [
                { from: ".", to: "../", context: "public" },
                { from: ".", to: "../", context: env.browser === "chrome" ? "manifest" : "manifest-firefox" },
                { from: ".", to: "../../dist-firefox", context: "manifest-firefox" }
            ] : [
                { from: ".", to: "../", context: "public" },
                { from: ".", to: "../", context: env.browser === "chrome" ? "manifest" : "manifest-firefox" },
            ]
        })
    ],
    mode: env.mode === "production" ? "production" : "development",
    devtool: env.mode === "production" ? false : "inline-source-map"
});
