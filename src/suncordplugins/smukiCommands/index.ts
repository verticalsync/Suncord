/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Command } from "@api/Commands";
import { SuncordDevs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import definePlugin, { PluginNative } from "@utils/types";

import * as commands from "./commands";
import { settings } from "./settings";

export const Native = VencordNative.pluginHelpers.SmukiCommands as PluginNative<typeof import("./native")>;
export const logger = new Logger("SmukiCommands", "#a6d189");

const extractedCommands: Command[] = [];
for (const key in commands) {
    extractedCommands.push(commands[key]);
}

export default definePlugin({
    name: "SmukiCommands",
    description: "roblox command collection for smuki (acoustic fella).",
    authors: [SuncordDevs.nyx],
    dependencies: ["CommandsAPI"],

    settings,

    commands: extractedCommands
});
