/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addContextMenuPatch, findGroupChildrenByChildId, NavContextMenuPatchCallback, removeContextMenuPatch } from "@api/ContextMenu";
import { Menu } from "@webpack/common";

import { addChannelToCategory, categories, isPinned, removeChannelFromCategory } from "../data";
import { openCategoryModal } from "./CreateCategoryModal";

function PinMenuItem(channelId: string, forceUpdate: () => void) {
    const pinned = isPinned(channelId);

    return (
        <Menu.MenuItem
            id="better-pin-dm"
            label="Pin DMs"
        >

            {!pinned && (
                <>
                    <Menu.MenuItem
                        id="add-category"
                        label="Add Category"
                        color="brand"
                        action={() => openCategoryModal(null, channelId, forceUpdate)}
                    />
                    <Menu.MenuSeparator />

                    {
                        categories.map(category => (
                            <Menu.MenuItem
                                id={`pin-category-${category.name}`}
                                label={category.name}
                                action={() => addChannelToCategory(channelId, category.id).then(() => forceUpdate())}
                            />
                        ))
                    }
                </>
            )}

            {pinned && (
                <Menu.MenuItem
                    id="unpin-dm"
                    label="Unpin DM"
                    color="danger"
                    action={() => removeChannelFromCategory(channelId).then(() => forceUpdate())}
                />
            )}

        </Menu.MenuItem>
    );
}

const GroupDMContext = (forceUpdate: () => void): NavContextMenuPatchCallback => (children, props) => () => {
    const container = findGroupChildrenByChildId("leave-channel", children);
    if (container)
        container.unshift(PinMenuItem(props.channel.id, forceUpdate));
};

const UserContext = (forceUpdate: () => void): NavContextMenuPatchCallback => (children, props) => () => {
    const container = findGroupChildrenByChildId("close-dm", children);
    if (container) {
        const idx = container.findIndex(c => c?.props?.id === "close-dm");
        container.splice(idx, 0, PinMenuItem(props.channel.id, forceUpdate));
    }
};

export function addContextMenus(forceUpdate: () => void) {
    addContextMenuPatch("gdm-context", GroupDMContext(forceUpdate));
    addContextMenuPatch("user-context", UserContext(forceUpdate));
}

export function removeContextMenus(forceUpdate: () => void) {
    removeContextMenuPatch("gdm-context", GroupDMContext(forceUpdate));
    removeContextMenuPatch("user-context", UserContext(forceUpdate));
}
