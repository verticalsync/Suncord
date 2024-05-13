/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { Devs } from "@utils/constants";
import { classes } from "@utils/misc";
import definePlugin, { OptionType, StartAt } from "@utils/types";
import { findByPropsLazy, findStoreLazy } from "@webpack";
import { ContextMenuApi, FluxDispatcher, Menu, React } from "@webpack/common";
import { Channel } from "discord-types/general";
import { contextMenus } from "./components/contextMenu";
import { openCategoryModal, requireSettingsMenu } from "./components/CreateCategoryModal";
import { DEFAULT_CHUNK_SIZE } from "./constants";
import { canMoveCategory, canMoveCategoryInDirection, categories, Category, categoryLen, collapseCategory, getAllUncollapsedChannels, getSections, init, isPinned, moveCategory, removeCategory } from "./data";


interface ChannelComponentProps {
    children: React.ReactNode;
    channel: Channel;
    selected: boolean;
}

const headerClasses = findByPropsLazy("privateChannelsHeaderContainer");
export const PrivateChannelSortStore = findStoreLazy("PrivateChannelSortStore") as { getPrivateChannelIds: () => string[]; };


export let instance: any;
export const forceUpdate = () => instance?.props?._forceUpdate?.();


export const enum PinOrder {
    LastMessage,
    Custom
}


export const settings = definePluginSettings({
    pinOrder: {
        type: OptionType.SELECT,
        description: "Which order should pinned DMs be displayed in?",
        options: [
            { label: "Most recent message", value: PinOrder.LastMessage, default: true },
            { label: "Custom (right click channels to reorder)", value: PinOrder.Custom }
        ],
        onChange: () => forceUpdate()
    },
    dmSectioncollapsed: {
        type: OptionType.BOOLEAN,
        description: "Collapse DM sections",
        default: false,
        onChange: () => forceUpdate()
    }
});


export default definePlugin({
    name: "PinDMs",
    description: "Allows you to pin private channels to the top of your DM list. To pin/unpin or reorder pins, right click DMs",
    authors: [Devs.Ven, Devs.Aria],
    settings,
    contextMenus,

    patches: [
        {
            find: ".privateChannelsHeaderContainer,",
            replacement: [
                {
                    // Filter out pinned channels from the private channel list
                    match: /(?<=\i,{channels:\i,)privateChannelIds:(\i)/,
                    replace: "privateChannelIds:$1.filter(c=>!$self.isPinned(c))"
                },
                {
                    // Insert the pinned channels to sections
                    match: /(?<=renderRow:this\.renderRow,)sections:\[.+?1\)]/,
                    replace: "...$self.makeProps(this,{$&})"
                },
                // Rendering adjustments
                {
                    match: /"renderRow",(\i)=>{(?<="renderDM",.+?(\i\.default),\{channel:.+?)/,
                    replace: "$&if($self.isChannelIndex($1.section, $1.row))return $self.renderChannel($1.section,$1.row,$2);"
                },
                {
                    match: /"renderSection",(\i)=>{/,
                    replace: "$&if($self.isCategoryIndex($1.section))return $self.renderCategory($1);"
                },
                {
                    match: /(?<=span",{)className:\i\.headerText,/,
                    replace: "...$self.makeSpanProps(),$&"
                },
                // Fix Row Height
                {
                    match: /(?<="getRowHeight",.{1,100}return 1===)\i/,
                    replace: "($&-$self.categoryLen())"
                },
                {
                    match: /"getRowHeight",\((\i),(\i)\)=>{/,
                    replace: "$&if($self.isChannelHidden($1,$2))return 0;"
                },
                // Fix ScrollTo
                {
                    // Override scrollToChannel to properly account for pinned channels
                    match: /(?<=scrollTo\(\{to:\i\}\):\(\i\+=)(\d+)\*\(.+?(?=,)/,
                    replace: "$self.getScrollOffset(arguments[0],$1,this.props.padding,this.state.preRenderedChildren,$&)"
                },
                {
                    match: /(?<=scrollToChannel\(\i\){.{1,300})this\.props\.privateChannelIds/,
                    replace: "[...$&,...$self.getAllUncollapsedChannels()]"
                },
            ]
        },
        
        {
            find: ".FRIENDS},\"friends\"",
            replacement: {
                match: /(?<=\i=\i=>{).{1,100}premiumTabSelected.{1,800}showDMHeader:.+?,/,
                replace: "let forceUpdate = Vencord.Util.useForceUpdater();$&_forceUpdate:forceUpdate,"
            }
        },

        {
            find: ".Routes.APPLICATION_STORE&&",
            replacement: {
                // channelIds = __OVERLAY__ ? stuff : [...getStaticPaths(),...channelIds)]
                match: /(?<=\i=__OVERLAY__\?\i:\[\.\.\.\i\(\),\.\.\.)\i/,
                // ....concat(pins).concat(toArray(channelIds).filter(c => !isPinned(c)))
                replace: "$self.getAllUncollapsedChannels().concat($&.filter(c=>!$self.isPinned(c)))"
            }
        },

        {
            find: ".getFlattenedGuildIds()],",
            replacement: {
                match: /(?<=\i===\i\.ME\?)\i\.\i\.getPrivateChannelIds\(\)/,
                replace: "$self.getAllUncollapsedChannels().concat($&.filter(c=>!$self.isPinned(c)))"
            }
        },
    ],

    startAt: StartAt.WebpackReady,
    start: init,
    flux: {
        CONNECTION_OPEN: init,
    },

    isPinned,
    categoryLen,
    getSections,
    getAllUncollapsedChannels,
    requireSettingsMenu,

    makeProps(instance, { sections }: { sections: number[]; }) {
        this._instance = instance;
        this.sections = sections;
        this.sections.splice(1, 0, ...this.getSections());

        if (this.instance?.props?.privateChannelIds?.length === 0) {
            // don't render direct messages header
            this.sections[this.sections.length
