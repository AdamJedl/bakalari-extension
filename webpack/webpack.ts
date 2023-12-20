/* eslint-disable func-names */
/* eslint-disable import/no-named-as-default */
/* eslint-disable import/no-anonymous-default-export */
/* eslint-disable import/no-unused-modules */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable unicorn/prevent-abbreviations */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable unicorn/prefer-module */
/* eslint-disable @typescript-eslint/naming-convention */

import path from "node:path";

import CopyPlugin from "copy-webpack-plugin";
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";
import JsonMinimizerPlugin from "json-minimizer-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import type webpack from "webpack";

const srcDir = path.join(__dirname, "..", "src");

export default function (env: any): webpack.Configuration {
    
    return {
        devtool: env.mode === "production" ? false : "inline-source-map",

        entry: {
            content_script: path.join(srcDir, "content-script.ts"),
            content_script_2: path.join(srcDir, "content-script-2.ts")
        },

        mode: env.mode === "production" ? "production" : "development",

        module: {
            rules: [
                {
                    loader: "esbuild-loader",
                    test: /\.ts$/v
                },
                {
                    test: /\.css$/v,
                    use: [MiniCssExtractPlugin.loader, "css-loader"]
                },
                {
                    test: /\.json$/v,
                    type: "asset/resource"
                }
            ]
        },

        optimization: {
            minimizer: [`...`, new CssMinimizerPlugin(), new JsonMinimizerPlugin()]
        },

        output: {
            filename: "[name].js",

            path: path.join(
                __dirname,
                env.browser === "chrome" ? "../dist/js" : "../dist-firefox/js"
            )
        },

        plugins: [
            new CopyPlugin({
                patterns:
                    env.all === true
                        ? [
                              { context: "public", from: ".", to: "../" },
                              {
                                  context:
                                      env.browser === "chrome" ? "manifest" : "manifest-firefox",

                                  from: ".",
                                  to: "../"
                              },
                              { context: "manifest-firefox", from: ".", to: "../../dist-firefox" }
                          ]
                        : [
                              { context: "public", from: ".", to: "../" },
                              {
                                  context:
                                      env.browser === "chrome" ? "manifest" : "manifest-firefox",

                                  from: ".",
                                  to: "../"
                              }
                          ]
            })
        ]
    };
}
