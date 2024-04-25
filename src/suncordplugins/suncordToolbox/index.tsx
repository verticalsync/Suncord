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

import "./index.css";

import { openNotificationLogModal } from "@api/Notifications/notificationLog";
import { migratePluginSettings, Settings, useSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { Devs, SuncordDevs } from "@utils/constants";
import definePlugin from "@utils/types";
import { findExportedComponentLazy } from "@webpack";
import { Menu, Popout, useState } from "@webpack/common";
import type { ReactNode } from "react";

const HeaderBarIcon = findExportedComponentLazy("Icon", "Divider");

migratePluginSettings("SuncordToolbox", "VencordToolbox");

function VencordPopout(onClose: () => void) {
    const { useQuickCss } = useSettings(["useQuickCss"]);

    const pluginEntries = [] as ReactNode[];

    for (const plugin of Object.values(Vencord.Plugins.plugins)) {
        if (plugin.toolboxActions && Vencord.Plugins.isPluginEnabled(plugin.name)) {
            pluginEntries.push(
                <Menu.MenuGroup
                    label={plugin.name}
                    key={`vc-toolbox-${plugin.name}`}
                >
                    {Object.entries(plugin.toolboxActions).map(([text, action]) => {
                        const key = `vc-toolbox-${plugin.name}-${text}`;

                        return (
                            <Menu.MenuItem
                                id={key}
                                key={key}
                                label={text}
                                action={action}
                            />
                        );
                    })}
                </Menu.MenuGroup>
            );
        }
    }

    return (
        <Menu.Menu
            navId="vc-toolbox"
            onClose={onClose}
        >
            <Menu.MenuItem
                id="vc-toolbox-notifications"
                label="Open Notification Log"
                action={openNotificationLogModal}
            />
            <Menu.MenuCheckboxItem
                id="vc-toolbox-quickcss-toggle"
                checked={useQuickCss}
                label={"Enable QuickCSS"}
                action={() => {
                    Settings.useQuickCss = !useQuickCss;
                }}
            />
            <Menu.MenuItem
                id="vc-toolbox-quickcss"
                label="Open QuickCSS"
                action={() => VencordNative.quickCss.openEditor()}
            />
            {...pluginEntries}
        </Menu.Menu>
    );
}

function VencordPopoutIcon(isShown: boolean) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 27 27" width={24} height={24}>
            <path fill="currentColor" d={isShown ? "M9.00,4.25C9.00,5.08,9.68,6.31,10.50,7.00C11.33,7.68,12.00,9.24,12.00,10.45C12.00,12.72,8.24,17.00,6.25,17.00C4.41,17.00,3.63,19.15,5.12,20.10C5.88,20.58,8.45,20.98,10.83,20.98C14.29,21.00,15.74,20.41,18.08,18.08C21.76,14.39,21.82,10.93,18.25,7.01C15.13,3.58,9.00,1.76,9.00,4.25" : "M 7.64,3.89 C 3.94,6.27 2.45,9.64 3.19,14.02 4.52,18.33 7.44,20.61 11.95,20.86 15.74,20.73 18.47,18.98 20.16,15.61 21.88,10.68 20.59,6.78 16.27,3.89 17.83,3.89 19.39,3.89 20.95,3.89 20.94,5.58 20.95,7.27 21.00,8.95 21.97,9.94 22.96,10.91 23.95,11.86 23.95,11.92 23.95,11.98 23.95,12.05 22.96,13.00 21.97,13.97 21.00,14.95 20.95,16.95 20.94,18.95 20.95,20.95 18.95,20.94 16.95,20.95 14.95,21.00 13.97,21.97 13.00,22.96 12.05,23.95 11.98,23.95 11.92,23.95 11.86,23.95 10.91,22.96 9.94,21.97 8.95,21.00 6.95,20.95 4.95,20.94 2.95,20.95 2.97,18.95 2.95,16.95 2.91,14.95 1.93,13.97 0.95,13.00 -0.05,12.05 -0.05,11.98 -0.05,11.92 -0.05,11.86 0.95,10.91 1.93,9.94 2.91,8.95 2.95,7.27 2.97,5.58 2.95,3.89 4.52,3.89 6.08,3.89 7.64,3.89 Z M 15.61,3.61 C 15.82,3.73 16.04,3.82 16.27,3.89 20.59,6.78 21.88,10.68 20.16,15.61 18.47,18.98 15.74,20.73 11.95,20.86 7.44,20.61 4.52,18.33 3.19,14.02 2.45,9.64 3.94,6.27 7.64,3.89 7.87,3.82 8.09,3.73 8.30,3.61 8.84,3.39 9.41,3.22 9.98,3.09 11.91,2.71 13.79,2.89 15.61,3.61 Z M 11.86,-0.05 C 11.92,-0.05 11.98,-0.05 12.05,-0.05 13.23,1.17 14.42,2.39 15.61,3.61 13.79,2.89 11.91,2.71 9.98,3.09 9.41,3.22 8.84,3.39 8.30,3.61 9.48,2.39 10.67,1.17 11.86,-0.05 Z"} />
        </svg>
    );
}

function VencordPopoutButton() {
    const [show, setShow] = useState(false);

    return (
        <Popout
            position="bottom"
            align="right"
            animation={Popout.Animation.NONE}
            shouldShow={show}
            onRequestClose={() => setShow(false)}
            renderPopout={() => VencordPopout(() => setShow(false))}
        >
            {(_, { isShown }) => (
                <HeaderBarIcon
                    className="vc-toolbox-btn"
                    onClick={() => setShow(v => !v)}
                    tooltip={isShown ? null : "Suncord Toolbox"}
                    icon={() => VencordPopoutIcon(isShown)}
                    selected={isShown}
                />
            )}
        </Popout>
    );
}

function ToolboxFragmentWrapper({ children }: { children: ReactNode[]; }) {
    children.splice(
        children.length - 1, 0,
        <ErrorBoundary noop={true}>
            <VencordPopoutButton />
        </ErrorBoundary>
    );

    return <>{children}</>;
}

export default definePlugin({
    name: "SuncordToolbox",
    description: "Adds a button next to the inbox button in the channel header that houses Suncord quick actions",
    authors: [Devs.Ven, Devs.AutumnVN, SuncordDevs.Cortex],

    patches: [
        {
            find: "toolbar:function",
            replacement: {
                match: /(?<=toolbar:function.{0,100}\()\i.Fragment,/,
                replace: "$self.ToolboxFragmentWrapper,"
            }
        }
    ],

    ToolboxFragmentWrapper: ErrorBoundary.wrap(ToolboxFragmentWrapper, {
        fallback: () => <p style={{ color: "red" }}>Failed to render :(</p>
    })
});
