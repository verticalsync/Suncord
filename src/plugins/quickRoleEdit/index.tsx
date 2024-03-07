/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import { getCurrentGuild } from "@utils/discord";
import definePlugin from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { Menu, PermissionStore } from "@webpack/common";

const GuildSettingsActions = findByPropsLazy("open", "selectRole", "updateGuild");

export default definePlugin({
    name: "QuickRoleEdit",
    description: "Adds an 'Edit Role' button when right clicking roles in the user profile. REQUIRES enabled Developer Mode!! (in advanced discord settings)",
    authors: [Devs.Ven],

    contextMenus: {
        "dev-context"(children, { id }: { id: string; }) {
            const guild = getCurrentGuild();
            const role = guild?.roles[id];
            if (!role) return;

            if (!PermissionStore.getGuildPermissionProps(guild).canManageRoles) return;

            children.push(
                <Menu.MenuItem
                    id="vc-edit-role"
                    label="Edit Role"
                    action={async () => {
                        await GuildSettingsActions.open(guild.id, "ROLES");
                        GuildSettingsActions.selectRole(id);
                    }}
                    icon={() => (
                        <svg
                            aria-hidden="true"
                            role="img"
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <path fill="currentColor" d="m13.96 5.46 4.58 4.58a1 1 0 0 0 1.42 0l1.38-1.38a2 2 0 0 0 0-2.82l-3.18-3.18a2 2 0 0 0-2.82 0l-1.38 1.38a1 1 0 0 0 0 1.42ZM2.11 20.16l.73-4.22a3 3 0 0 1 .83-1.61l7.87-7.87a1 1 0 0 1 1.42 0l4.58 4.58a1 1 0 0 1 0 1.42l-7.87 7.87a3 3 0 0 1-1.6.83l-4.23.73a1.5 1.5 0 0 1-1.73-1.73Z" />
                        </svg>
                    )}
                />
            );
        }
    }
});
