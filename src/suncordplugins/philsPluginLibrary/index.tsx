/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

import { replacedUserPanelComponent } from "./patches";

const settings = definePluginSettings({
    hideDefaultSettings: {
        type: OptionType.BOOLEAN,
        description: "Hide Discord screen sharing settings",
        default: true,
    }
});

export default definePlugin({
    name: "PhilsPluginLibrary",
    description: "A library for phil's plugins",
    authors: [Devs.philhk],
    replacedUserPanelComponent: replacedUserPanelComponent,

    patches: [
        {
            find: "Messages.ACCOUNT_A11Y_LABEL",
            replacement: {
                match: /(?<=function)( .{0,8}(?={).)(.{0,1000}isFullscreenInContext\(\).+?\)]}\))(})/,
                replace: "$1return $self.replacedUserPanelComponent(function(){$2}, this, arguments)$3"
            }
        }
    ],

    settings
});


export * from "./components";
export * from "./discordModules";
export * from "./emitter";
export * from "./icons";
export * from "./patchers";
export * from "./patches";
export * from "./store";
export * as types from "./types";
export * from "./utils";
