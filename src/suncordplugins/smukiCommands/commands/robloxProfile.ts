/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ApplicationCommandInputType, ApplicationCommandOptionType, findOption, sendBotMessage } from "@api/Commands";

import { settings } from "../settings";
import { getUserID, getUserProfile } from "../utils/roblox";


const command = {
    name: "roblox-profile",
    description: "Get some profile information of an user",
    inputType: ApplicationCommandInputType.BUILT_IN,
    predicate: _ => settings.store.profileCommand,
    options: [{
        name: "username",
        description: "Roblox username of the individual you're looking up",
        type: ApplicationCommandOptionType.STRING,
        required: true
    }],
    async execute(args, ctx) {
        if (IS_WEB) {
            sendBotMessage(ctx.channel.id, { content: "This command uses native requests, web not supported." });
            return;
        }

        const username = findOption<string>(args, "username");
        if (!username) {
            sendBotMessage(ctx.channel.id, { content: "username undefined?" });
            return;
        }

        const userID = await getUserID(username);

        if (!userID) {
            sendBotMessage(ctx.channel.id, { content: "Unknown user." });
            return;
        }

        const userData = await getUserProfile(userID);
        if (!userData) {
            sendBotMessage(ctx.channel.id, { content: "Failed to get user profile." });
            return;
        }

        sendBotMessage(ctx.channel.id, {
            embeds: [{
                type: "rich",
                title: `User information about ${userData.name}`,
                color: 0xFFFF00,
                fields: [
                    {
                        name: "UserID",
                        value: `${userID}`
                    },
                    {
                        name: "Display Name",
                        value: userData.displayName
                    },
                    {
                        name: "Description",
                        value: userData.description
                    },
                    {
                        name: "Created At",
                        value: userData.created
                    },
                    {
                        name: "Verified",
                        value: `${userData.hasVerifiedBadge}`
                    }
                ]
            }] as any
        });
    },
};

export { command as profileCommand };
