/* eslint-disable import/no-unused-modules */
/* eslint-disable camelcase */
/* eslint-disable unicorn/prevent-abbreviations */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable unicorn/prefer-module */
/* eslint-disable @typescript-eslint/naming-convention */

import path from "node:path";

import CopyPlugin from "copy-webpack-plugin";
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";
import JsonMinimizerPlugin from "json-minimizer-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import TerserPlugin from "terser-webpack-plugin";
import type Webpack from "webpack";

const srcDir = path.join(__dirname, "..", "src");

interface Env {
    readonly all: boolean;
    readonly browser: "chrome" | "firefox" | undefined;
    readonly mode: "development" | "production";
}

export default function webpack (env: Env): Webpack.Configuration {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (env.mode !== "production" && env.mode !== "development") {
        throw new Error("unknown mode");
    }

    if (env.browser !== "chrome" && env.browser !== "firefox" && !env.all) {
        throw new Error("unknown browser");
    }

    if (env.all && env.browser !== undefined) {
        throw new Error("env browser is unnecessary when env all is set");
    }

    return {
        devtool: env.mode === "production" ? false : "inline-source-map",

        entry: {
            content_script: path.join(srcDir, "content-script.ts"),
            content_script_2: path.join(srcDir, "content-script-2.ts")
        },

        mode: env.mode,

        module: {
            rules: [
                {
                    loader: "swc-loader",

                    options: {
                        jsc: {
                            parser: {
                                syntax: "typescript"
                            },

                            target: "es2021"
                        },

                        module: {
                            type: "commonjs"
                        }
                    },

                    test: /\.ts$/u
                },
                {
                    test: /\.css$/u,
                    use: [MiniCssExtractPlugin.loader, "css-loader"]
                },
                {
                    test: /\.json$/u,
                    type: "asset/resource"
                }
            ]
        },

        optimization:
            env.mode === "production"
                ? {
                      minimize: true,

                      minimizer: [
                          new TerserPlugin({
                              minify: TerserPlugin.swcMinify,

                              terserOptions: {
                                  compress: {
                                      passes: 0
                                  },

                                  mangle: true
                              }
                          }),
                          new CssMinimizerPlugin(),
                          new JsonMinimizerPlugin()
                      ]
                  }
                : undefined,

        output: {
            filename: "[name].js",

            path: path.join(
                __dirname,
                env.all || env.browser === "chrome" ? "../dist/js" : "../dist-firefox/js"
            )
        },

        plugins: [
            new CopyPlugin({
                patterns: env.all
                    ? [
                          { context: "public", from: ".", to: "../" },
                          {
                              context: "manifest",

                              from: ".",
                              to: "../"
                          },
                          { context: "manifest-firefox", from: ".", to: "../../dist-firefox" }
                      ]
                    : [
                          { context: "public", from: ".", to: "../" },
                          {
                              context: env.browser === "chrome" ? "manifest" : "manifest-firefox",

                              from: ".",
                              to: "../"
                          }
                      ]
            })
        ]
    };
}
