/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { classNameFactory } from "@api/Styles";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy, wreq } from "@webpack";
import { ComponentDispatch, Forms, useEffect, useRef } from "@webpack/common";
import { HTMLAttributes } from "react";

const cl = classNameFactory("");
const Classes = findByPropsLazy("animating", "baseLayer", "bg", "layer", "layers");

const settings = definePluginSettings({
    eagerLoad: {
        description: "Eagerly load menu contents (faster, but slightly more network load)",
        type: OptionType.BOOLEAN,
        default: true,
        onChange(val) {
            if (val) eagerLoad();
        }
    },
});

const lazyLayers: string[] = [];
function eagerLoad() {
    // @ts-ignore
    lazyLayers.forEach(wreq.el);
}

export default definePlugin({
    name: "FastMenu",
    description: "Makes the settings menu open faster.",
    authors: [{ id: 236588665420251137n, name: "Kyuuhachi" }],
    settings,

    patches: [
        {
            find: "this.renderArtisanalHack()",
            replacement: [
                { // Fade in on layer
                    match: /(?<=(\w+)\.contextType=\w+\.AccessibilityPreferencesContext;)/,
                    replace: "$1=$self.Layer;",
                },
                { // Grab lazy-loaded layers
                    match: /webpackId:("\d+"),name:("\w+")/g,
                    replace: "$&,_:$self.lazyLayer($1,$2)",
                },
            ],
        },
        // For some reason standardSidebarView also has a small fade-in
        {
            find: "},DefaultCustomContentScroller:function(){return ",
            replacement: {
                match: /(?<=Fragment,\{children:)\w+\(\((\w+),\w+\)=>(\(0,\w+\.jsxs\))\(\w+\.animated\.div,\{style:\1,/,
                replace: "($2(\"div\",{"
            }
        },
        { // load menu stuff on hover, not on click
            find: "Messages.USER_SETTINGS_WITH_BUILD_OVERRIDE.format",
            replacement: ((module_id: string) => [
                {
                    match: /handleOpenSettingsContextMenu.{0,250}?\i\.el\(("\d+")\)\.then/,
                    replace: (text, w) => (module_id = w, text)
                },
                {
                    match: /(?<=Messages\.USER_SETTINGS,)/,
                    replace: () => `async onMouseEnter(){let r=Vencord.Webpack.wreq;await r.el(${module_id});r(${module_id});},`,
                },
            ])(null as any),
            predicate: () => settings.store.eagerLoad,
        },
    ],

    Layer({ mode, baseLayer = false, ...props }: {
        mode: "SHOWN" | "HIDDEN";
        baseLayer?: boolean;
    } & HTMLAttributes<HTMLDivElement>) {
        const hidden = mode === "HIDDEN";
        const containerRef = useRef<HTMLDivElement>(null);
        useEffect(() => () => {
            ComponentDispatch.dispatch("LAYER_POP_START");
            ComponentDispatch.dispatch("LAYER_POP_COMPLETE");
        }, []);
        const node = <div
            ref={containerRef}
            aria-hidden={hidden}
            className={cl({
                [Classes.layer]: true,
                [Classes.baseLayer]: baseLayer,
                "stop-animations": hidden,
            })}
            style={{ visibility: hidden ? "hidden" : "visible" }}
            {...props}
        />;
        if (baseLayer) return node;
        // @ts-ignore
        else return <Forms.FocusLock containerRef={containerRef}>{node}</Forms.FocusLock>;
    },

    lazyLayer(moduleId: string, name: string) {
        if (name !== "CollectiblesShop")
            lazyLayers.push(moduleId);
    },

    start() {
        if (settings.store.eagerLoad)
            eagerLoad();
    },
});
