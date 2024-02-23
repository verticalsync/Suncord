/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { Devs } from "@utils/constants";
import { classes } from "@utils/misc";
import definePlugin from "@utils/types";
import { findByPropsLazy, waitFor } from "@webpack";
import { Alerts, Button, ContextMenuApi, FluxDispatcher, Menu, React, UserStore } from "@webpack/common";
import { Channel } from "discord-types/general";
import { Settings } from "Vencord";

import { addContextMenus, removeContextMenus } from "./components/contextMenu";
import { openCategoryModal, requireSettingsMenu } from "./components/CreateCategoryModal";
import { canMoveCategory, canMoveCategoryInDirection, categories, initCategories, isPinned, migrateData, moveCategory, removeCategory } from "./data";
import * as data from "./data";

const headerClasses = findByPropsLazy("privateChannelsHeaderContainer");

export let instance: any;
export const forceUpdate = () => instance?.props?._forceUpdate?.();

// the flux property in definePlugin doenst fire, probably because startAt isnt Init
waitFor(["dispatch", "subscribe"], m => {
    m.subscribe("CONNECTION_OPEN", async () => {
        const id = UserStore.getCurrentUser()?.id;
        await initCategories(id);
        await migrateData();
        forceUpdate();
        // dont want to unsubscribe because if they switch accounts we want to reinit
    });
});



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
                    match: /(renderRow:this\.renderRow,sections:)(\[\i,)Math.max\((\i)\.length,1\)/,
                    replace: "$1$self.sections = $2...this.props.pinCount2??[],Math.max($3.length,0)"
                },
                {
                    match: /\(\i,{},"no-private-channels"/,
                    replace: "(Vencord.Util.NoopComponent,{},\"no-private-channels\""
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
                    replace: "$&$self._instance = this;"
                },
                {
                    match: /this.getRowHeight=\((\i),(\i)\)=>{/,
                    replace: "$&if($self.isChannelHidden($1,$2))return 0;"
                },

                {
                    match: /this.getSectionHeight=(\i)=>{/,
                    replace: "$&if($self.isCategoryIndex($1))return 40;"
                },
                {
                    // Copied from PinDMs
                    // Override scrollToChannel to properly account for pinned channels
                    match: /(?<=scrollTo\(\{to:\i\}\):\(\i\+=)(\d+)\*\(.+?(?=,)/,
                    replace: "$self.getScrollOffset(arguments[0],$1,this.props.padding,this.state.preRenderedChildren,$&)"
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
    data,
    sections: null as number[] | null,

    set _instance(i: any) {
        this.instance = i;
        instance = i;
    },

    isPinned,
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

        addContextMenus();
        requireSettingsMenu();
    },

    stop() {
        removeContextMenus();
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

    isChannelIndex(sectionIndex: number, channelIndex: number) {
        return this.sections && this.isCategoryIndex(sectionIndex) && categories[sectionIndex - this.getSub()]?.channels[channelIndex];
    },

    isChannelHidden(categoryIndex: number, channelIndex: number) {
        if (!this.instance || !this.isChannelIndex(categoryIndex, channelIndex)) return false;
        const category = categories[categoryIndex - 1];
        if (!category) return false;

        return category.colapsed && this.instance.props.selectedChannelId !== category.channels[channelIndex];
    },

    getScrollOffset(channelId: string, rowHeight: number, padding: number, preRenderedChildren: number, originalOffset: number) {
        if (!isPinned(channelId))
            return (
                (rowHeight + padding) * 2 // header
                + rowHeight * this.getAllChannels().length // pins
                + originalOffset // original pin offset minus pins
            );

        return rowHeight * (this.getAllChannels().indexOf(channelId) + preRenderedChildren) + padding;
    },

    renderCategory({ section }: { section: number; }) {
        const category = categories[section - this.getSub()];
        // console.log("renderCat", section, category);

        if (!category) return null;

        return (
            <h2
                className={classes(headerClasses.privateChannelsHeaderContainer, "vc-pindms-section-container", category.colapsed ? "vc-pindms-colapsed" : "")}
                style={{ color: `#${category.color.toString(16).padStart(6, "0")}` }}
                onClick={async () => {
                    await data.collapseCategory(category.id, !category.colapsed);
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
                                action={() => openCategoryModal(category.id, null)}
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
                {/* <span className="vc-pindms-channel-count">
                    {category.channels.length}
                </span> */}
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
