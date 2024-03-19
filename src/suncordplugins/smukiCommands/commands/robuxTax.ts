/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ApplicationCommandInputType, ApplicationCommandOptionType, findOption, sendBotMessage } from "@api/Commands";

import { settings } from "../settings";
import { calculateRobloxTax } from "../utils/roblox";

const command = {
    name: "robux-tax",
    description: "Calculate the robux tax before and after",
    inputType: ApplicationCommandInputType.BUILT_IN,
    predicate: _ => settings.store.taxCommand,
    options: [{
        name: "amount",
        description: "Amount of robux to do the tax calculation on",
        type: ApplicationCommandOptionType.INTEGER,
        required: true
    },
    {
        name: "tax",
        description: "Tax percentage",
        type: ApplicationCommandOptionType.INTEGER,
        required: false
    }],
    async execute(args, ctx) {
        const amount = findOption<number>(args, "amount");
        const tax = findOption<number>(args, "tax") || 30;
        if (!amount) {
            sendBotMessage(ctx.channel.id, { content: "Amount undefined?" });
            return;
        }

        const calculatedTax = calculateRobloxTax(amount, tax);
        sendBotMessage(ctx.channel.id, {
            embeds: [
                {
                    type: "rich",
                    title: "Roblox Tax Calculation",
                    color: 0x2a9645,
                    fields: [
                        {
                            name: "Gross",
                            value: calculatedTax.grossAmount.toString(),
                            inline: true
                        },
                        {
                            name: "Net",
                            value: calculatedTax.netAmount.toString(),
                            inline: true
                        },
                        {
                            name: "Taxed",
                            value: calculatedTax.taxAmount.toString(),
                            inline: true
                        }
                    ],
                    footer: {
                        text: `Tax percentage: ${tax}`,
                    },
                }
            ] as any
        });
    },
};

export { command as taxCommand };
