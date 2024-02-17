/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addContextMenuPatch, NavContextMenuPatchCallback, removeContextMenuPatch } from "@api/ContextMenu";
import { DataStore } from "@api/index";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { findStoreLazy } from "@webpack";
import { Menu, showToast } from "@webpack/common";
import { User } from "discord-types/general";

import { settings } from "./settings";

export let userWhitelist: string[] = [];

export const DATASTORE_KEY = "DnDBypass_whitelistedUsers";
const SelfPresenceStore = findStoreLazy("SelfPresenceStore");

const userPopoutPatch: NavContextMenuPatchCallback = (children, props: { user: User, onClose(): void; }) => () => {
    children.push(
        <Menu.MenuItem
            label={userWhitelist.includes(props.user.id) ?
                "Remove user from DND whitelist" : "Add user to DND whitelist"}
            id="vc-dnd-whitelist"
            action={() => whitelistUser(props.user)}
        />
    );
};

function whitelistUser(user: User) {
    if (userWhitelist.includes(user.id)) {
        userWhitelist = userWhitelist.filter(id => id !== user.id);
        showToast("Removed user from DND whitelist");
    } else {
        userWhitelist.push(user.id);
        showToast("Added user to DND whitelist");
    }

    DataStore.set(DATASTORE_KEY, userWhitelist);
}

export default definePlugin({
    name: "DnDBypass",
    description: "Bypass DND for specified users",
    authors: [Devs.mantikafasi],

    patches: [
        {
            find: "ThreadMemberFlags.NO_MESSAGES&&",
            replacement: {
                match: /return!\(null!=.+?&&!0/,
                replace: "if (!n.guild_id && $self.shouldNotify(t)) {return true;} $&"
            }
        }
    ],
    settings,

    shouldNotify(author: User) {
        console.log(author);
        if (SelfPresenceStore.getStatus() !== "dnd") {
            return false;
        }
        return userWhitelist.includes(author.id);
    },

    async start() {
        addContextMenuPatch("user-context", userPopoutPatch);
        userWhitelist = await DataStore.get(DATASTORE_KEY) ?? [];
    },

    stop() {
        removeContextMenuPatch("user-context", userPopoutPatch);
    }

});
