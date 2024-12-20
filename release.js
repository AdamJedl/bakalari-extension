#!/usr/bin/env bun

import { mkdir, rm } from "node:fs/promises";
import { $ } from "bun";

await rm("release", { recursive: true });
await mkdir("release");

let chromium_browsers = [
    "io.github.ungoogled_software.ungoogled_chromium",
    "brave",
    "com.brave.Browser",
    "chromium",
    "org.chromium.Chromium",
    "com.google.Chrome",
    "chrome"
];
let directory = (await $`pwd`.cwd("..").text()).slice(0, -1);
for (const browser of chromium_browsers) {
    let output = await $`${browser} --pack-extension=dist --pack-extension-key=${directory}/chrome.pem`.nothrow().quiet();
    if (output.exitCode === 0) {
        break;
    }
}
await $`mv dist.crx release/bakalari-extension-chrome.crx`;

await $`zip -r ../release/bakalari-extension-chrome.zip *`.cwd("dist").quiet();

await $`zip -r ../release/bakalari-extension-firefox.xpi *`.cwd("dist-firefox").quiet();

await $`cp dist-userscript/bakalari-extension.user.js release/`;

console.log("release.js completed successfully")
