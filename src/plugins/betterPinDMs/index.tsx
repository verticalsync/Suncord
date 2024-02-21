/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { Devs } from "@utils/constants";
import { classes } from "@utils/misc";
import definePlugin from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { Alerts, Button, ContextMenuApi, FluxDispatcher, Menu, React } from "@webpack/common";
import { Channel } from "discord-types/general";
import { Settings } from "Vencord";

import { addContextMenus, removeContextMenus } from "./components/contextMenu";
import { openCategoryModal, requireSettingsMenu } from "./components/CreateCategoryModal";
import { canMoveCategory, canMoveCategoryInDirection, categories, isPinned, moveCategory, removeCategory } from "./data";
// import * as data from "./data";

const headerClasses = findByPropsLazy("privateChannelsHeaderContainer");

export default definePlugin({
    name: "BetterPinDMs",
    description: "Pin DMs but with categories",
    authors: [Devs.Aria, Devs.Ven, Devs.Strencher],

    patches: [
        {
            find: ".privateChannelsHeaderContainer,",
            predicate: () => !Settings.plugins.PinDMs?.enabled,
            replacement: [
                {
                    match: /(?<=\i,{channels:\i,)privateChannelIds:(\i)/,
                    replace: "privateChannelIds:$1.filter(c=>!$self.isPinned(c)),pinCount2:$self.usePinCount($1)"
                },
                {
                    match: /(renderRow:this\.renderRow,sections:)(\[\i,)/,
                    replace: "$1$self.sections = $2...this.props.pinCount2??[],"
                },
                {
                    match: /this\.renderSection=(\i)=>{/,
                    replace: "$&if($self.isCategoryIndex($1.section))return $self.renderCategory($1);"
                },
                // {
                //     match: /(this\.renderDM=\((\i),(\i)\)=>{.{1,200}this\.state,.{1,200})(\i\[\i\];return)/,
                //     replace: "$1$self.isCategoryIndex($2)?$self.getChannel($2,$3,this.props.channels):$4"
                // },
                {

                    match: /(this\.renderDM=\((\i),(\i)\)=>{)(.{1,300}return null==\i.{1,20}\((\i\.default),{channel:)/,
                    replace: "$1if($self.isCategoryIndex($2))return $self.renderChannel(this,$2,$3,this.props.channels,$5);$4"
                },
                {
                    match: /(this\.getRowHeight=.{1,100}return 1===)(\i)/,
                    replace: "$1($2-$self.categoryLen())"
                },
                {
                    match: /componentDidMount\(\){/,
                    replace: "$&$self.instance = this;"
                }
            ]
        },

        // forceUpdate moment
        // https://regex101.com/r/kDN9fO/1
        {
            find: ".FRIENDS},\"friends\"",
            predicate: () => !Settings.plugins.PinDMs?.enabled,
            replacement: {
                match: /(\i=\i=>{)(.{1,850})showDMHeader:/,
                replace: "$1let forceUpdate = Vencord.Util.useForceUpdater();$2_forceUpdate:forceUpdate,showDMHeader:"
            }
        },

        // copied from PinDMs
        // Fix Alt Up/Down navigation
        {
            find: ".Routes.APPLICATION_STORE&&",
            predicate: () => !Settings.plugins.PinDMs?.enabled,
            replacement: {
                // channelIds = __OVERLAY__ ? stuff : [...getStaticPaths(),...channelIds)]
                match: /(?<=\i=__OVERLAY__\?\i:\[\.\.\.\i\(\),\.\.\.)\i/,
                // ....concat(pins).concat(toArray(channelIds).filter(c => !isPinned(c)))
                replace: "$self.getAllChannels().concat($&.filter(c=>!$self.isPinned(c)))"
            }
        },

        // copied from PinDMs
        // fix alt+shift+up/down
        {
            find: ".getFlattenedGuildIds()],",
            replacement: {
                match: /(?<=\i===\i\.ME\?)\i\.\i\.getPrivateChannelIds\(\)/,
                replace: "$self.getAllChannels().concat($&.filter(c=>!$self.isPinned(c)))"
            }
        },
    ],
    // data,
    isPinned,

    sections: null as number[] | null,
    instance: null as any | null,
    forceUpdate() {
        this.instance?.props?._forceUpdate?.();
    },
    start() {
        if (Settings.plugins.PinDMs?.enabled) {
            console.log("disable PinDMs to use this plugin");
            setTimeout(() => {
                Alerts.show({
                    title: "PinDMs Enabled",
                    body: "BetterPinDMs requires PinDMs to be disabled. Please disable it to use this plugin.",
                    confirmText: "Disable",
                    confirmColor: Button.Colors.RED,
                    cancelText: "Cancel",

                    onConfirm: () => {
                        Settings.plugins.PinDMs.enabled = false;
                        location.reload();
                    },
                });
            }, 5_000);
            return;
        }

        addContextMenus(this.forceUpdate.bind(this));
        requireSettingsMenu();
    },

    stop() {
        removeContextMenus(this.forceUpdate.bind(this));
    },

    getSub() {
        return Vencord.Settings.plugins.PinDMs.enabled ? 2 : 1;
    },

    categoryLen() {
        return categories.length;
    },

    getAllChannels() {
        return categories.map(c => c.channels).flat();
    },

    usePinCount(channelIds: string[]) {
        return channelIds.length ? this.getSections() : [];
    },

    getSections() {
        return categories.reduce((acc, category) => {
            acc.push(category.channels.length === 0 ? 1 : category.channels.length);
            return acc;
        }, [] as number[]);
    },

    isCategoryIndex(sectionIndex: number) {
        return this.sections && sectionIndex > (this.getSub() - 1) && sectionIndex < this.sections.length - 1;
    },

    renderCategory({ section }: { section: number; }) {
        const category = categories[section - this.getSub()];
        // console.log("renderCat", section, category);

        if (!category) return null;

        return (
            <h2
                className={classes(headerClasses.privateChannelsHeaderContainer, "vc-pindms-section-container", category.colapsed ? "vc-pindms-colapsed" : "")}
                style={{ color: `#${category.color.toString(16).padStart(6, "0")}` }}
                onClick={() => {
                    category.colapsed = !category.colapsed;
                    this.forceUpdate();
                }}
                onContextMenu={e => {
                    ContextMenuApi.openContextMenu(e, () => (
                        <Menu.Menu
                            navId="vc-pindms-header-menu"
                            onClose={() => FluxDispatcher.dispatch({ type: "CONTEXT_MENU_CLOSE" })}
                            color="danger"
                            aria-label="Pin DMs Category Menu"
                        >
                            <Menu.MenuItem
                                id="vc-pindms-edit-category"
                                label="Edit Category"
                                action={() => openCategoryModal(category.id, null, () => this.forceUpdate())}
                            />

                            <Menu.MenuItem
                                id="vc-pindms-delete-category"
                                color="danger"
                                label="Delete Category"
                                action={() => removeCategory(category.id).then(() => this.forceUpdate())}
                            />

                            {
                                canMoveCategory(category.id) && (
                                    <>
                                        <Menu.MenuSeparator />
                                        <Menu.MenuItem
                                            id="vc-pindms-move-category"
                                            label="Move Category"
                                        >
                                            {
                                                canMoveCategoryInDirection(category.id, -1) && <Menu.MenuItem
                                                    id="vc-pindms-move-category-up"
                                                    label="Move Up"
                                                    action={() => moveCategory(category.id, -1).then(() => this.forceUpdate())}
                                                />
                                            }
                                            {
                                                canMoveCategoryInDirection(category.id, 1) && <Menu.MenuItem
                                                    id="vc-pindms-move-category-down"
                                                    label="Move Down"
                                                    action={() => moveCategory(category.id, 1).then(() => this.forceUpdate())}
                                                />
                                            }
                                        </Menu.MenuItem>
                                    </>

                                )
                            }
                        </Menu.Menu>
                    ));
                }}
            >
                <span className={headerClasses.headerText}>
                    {category?.name ?? "uh oh"}
                </span>
                <svg className="vc-pindms-colapse-icon" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M9.3 5.3a1 1 0 0 0 0 1.4l5.29 5.3-5.3 5.3a1 1 0 1 0 1.42 1.4l6-6a1 1 0 0 0 0-1.4l-6-6a1 1 0 0 0-1.42 0Z"></path>
                </svg>
            </h2>
        );
    },

    // this is crazy
    renderChannel(instance: any, sectionIndex: number, index: number, channels: Record<string, Channel>, ChannelComponent: React.ComponentType<{ children: React.ReactNode, channel: Channel, selected: boolean; }>) {
        const { channel, category } = this.getChannel(sectionIndex, index, channels);
        // console.log("renderChannel", sectionIndex, index, channel);

        if (!channel || !category) return null;
        const selected = instance.props.selectedChannelId === channel.id;

        if (!selected && category.colapsed) return null;

        return (
            <ChannelComponent
                channel={channel}
                selected={selected}
                aria-posinset={instance.state.preRenderedChildren + index + 1}
                aria-setsize={instance.state.totalRowCount}
            >
                {channel.id}
            </ChannelComponent>
        );
    },

    getChannel(sectionIndex: number, index: number, channels: Record<string, Channel>) {
        const category = categories[sectionIndex - this.getSub()];
        const channelId = category?.channels[index];

        // console.log("getChannel", sectionIndex, index, channelId);

        return { channel: channels[channelId], category };
    }
});

