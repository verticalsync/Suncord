/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { i18n, Menu, SettingsRouter } from "@webpack/common";
import type { ReactElement } from "react";
type SettingsEntry = { section: string, label: string; };

export default definePlugin({
    name: "SettingsCog",
    description: "Adds categories when right-clicking the settings cog. It's way too long.",
    authors: [Devs.Kyuuhachi],

    patches: [
        {
            find: "Messages.USER_SETTINGS_ACTIONS_MENU_LABEL",
            replacement: {
                match: /\(0,\i.default\)\(\)(?=\.filter)/,
                replace: "$self.wrap($&)"
            }
        }
    ],

    wrap(list: SettingsEntry[]) {
        const items = [{ label: null as string | null, items: [] as SettingsEntry[] }];
        for (const item of list) {
            if (item.section === "HEADER") {
                items.push({ label: item.label, items: [] });
            } else if (item.section === "DIVIDER") {
                items.push({ label: i18n.Messages.OTHER_OPTIONS, items: [] });
            } else {
                items.at(-1)!.items.push(item);
            }
        }
        return {
            items,
            filter(predicate: (item: SettingsEntry) => boolean) {
                for (const category of this.items) {
                    category.items = category.items.filter(predicate);
                }
                return this;
            },
            map(render: (item: SettingsEntry) => ReactElement) {
                return this.items
                    .filter(a => a.items.length > 0)
                    .map(({ label, items }) => {
                        const children = items.map(render);
                        children.forEach(c => {
                            const id = c?.props?.id;
                            if (id?.startsWith("Vencord") || id?.startsWith("Vesktop") || id?.startsWith("Suncord")) {
                                c.props.action = () => SettingsRouter.open(id);
                            }
                        });
                        if (label) {
                            return <Menu.MenuItem
                                id={label.replace(/\W/, "_")}
                                label={label}
                                children={children}
                            />;
                        } else {
                            return children;
                        }
                    });
            },
        };
    }
});
