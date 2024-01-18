/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
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

import { ApplicationCommandInputType, ApplicationCommandOptionType, findOption, sendBotMessage } from "@api/Commands";
import { SuncordDevs } from "@utils/constants";
import definePlugin from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { MessageStore, UserStore } from "@webpack/common";
import { Channel, Message } from "discord-types/general";

const MessageActions = findByPropsLazy("deleteMessage", "startEditMessage");

function DeleteMessages(amount: number, channel: Channel, delay: number = 1500) {
    const meId = UserStore.getCurrentUser().id;
    const messages: Message[] = MessageStore.getMessages(channel.id)._array.filter((m: Message) => m.author.id === meId).reverse().slice(0, amount);
    var msgs: Message[] = JSON.parse(JSON.stringify(messages));
    var counter = 0;

    function deleteNextMessage() {
        if (counter < msgs.length) {
            const msg = msgs[counter];
            MessageActions.deleteMessage(channel.id, msg.id);
            counter += 1;
            setTimeout(deleteNextMessage, delay);
        }
    }

    deleteNextMessage();

    return counter;
}

export default definePlugin({
    name: "MessagePurge",
    description: "Purges messages from a channel",
    dependencies: ["CommandsAPI"],
    authors: [SuncordDevs.bhop, SuncordDevs.nyx],
    commands: [
        {
            name: "purge",
            description: "Manage Purge related Menu",
            inputType: ApplicationCommandInputType.BUILT_IN,
            options: [
                {
                    name: "purge",
                    description: "Begins purging messages by a set amount",
                    type: ApplicationCommandOptionType.SUB_COMMAND,
                    options: [
                        {
                            name: "amount",
                            description: "How many messages you wish to purge",
                            type: ApplicationCommandOptionType.INTEGER,
                            required: true
                        },
                        {
                            name: "channel",
                            description: "Channel ID you wish to purge from",
                            type: ApplicationCommandOptionType.CHANNEL,
                            required: false
                        }
                    ]
                }
            ],

            async execute(args, ctx) {
                switch (args[0].name) {
                    case "purge": {
                        const amount: number = findOption(args[0].options, "amount", 0);
                        const channel: Channel = findOption(args[0].options, "channel", ctx.channel);
                        const len = DeleteMessages(amount, channel);
                        return sendBotMessage(ctx.channel.id, {
                            content: `> deleted ${len} messages.`
                        });
                    }

                    default: {
                        return sendBotMessage(ctx.channel.id, {
                            content: "> invalid sub-command."
                        });

                    }
                }
            }
        }
    ],
});
