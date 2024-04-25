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

/* eslint-disable no-useless-escape */

import { Devs } from "@utils/constants";
import { insertTextIntoChatInputBox } from "@utils/discord";
import definePlugin from "@utils/types";
import { React, Tooltip } from "@webpack/common";

import { SlashCommandMention } from "./types";

const slashCommandMention = /<\/((?:[-_\p{Letter}\p{Number}\p{sc=Deva}\p{sc=Thai}]{1,32})(?: [-_\p{Letter}\p{Number}\p{sc=Deva}\p{sc=Thai}]{1,32})*)(?:\s+[-_\p{Letter}\p{Number}\p{sc=Deva}\p{sc=Thai}]+=(?:"[^"]*"|\d+|true|false|@[0-9]+|#\d+|&\d+|@&\d+|https?:\/\/\S+))*(?::(\d+))?>/gu;
const slashCommandMentionName = /^<\/((?:[-\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]+)(?:\s+[-\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]+)*)(?=\s+[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]+=)/u;
const slashCommandMentionOptions = /<\/(?:[-_\p{Letter}\p{Number}\p{sc=Deva}\p{sc=Thai}]{1,32})(?: [-_\p{Letter}\p{Number}\p{sc=Deva}\p{sc=Thai}]{1,32})*\s+((?:[-_\p{Letter}\p{Number}\p{sc=Deva}\p{sc=Thai}]+=(?:"[^"]*"|\d+|true|false|@[0-9]+|#\d+|&\d+|@&\d+|https?:\/\/\S+)\s*)+)/u;

function transformOptions(options: string) {
    const keyValuePattern = /(\w+)=("[^"]+"|\S+)/g;
    let match: string[] | null;
    let result = "";

    while ((match = keyValuePattern.exec(options)) !== null) {
        const key = match[1];
        let value = match[2].replace(/^"|"$/g, "");
        value = value.replace(/^[@&]+/, "");
        result += `${key}: ${value} `;
    }

    return result.trim();
}

function slashCommandMentionClick(command: string, options: string) {
    insertTextIntoChatInputBox(`/${command} ${transformOptions(options)}`);
}

const SlashCommandMentionTag = (mention: SlashCommandMention) => {
    let options = slashCommandMentionOptions.exec(mention)?.[1];

    if (typeof options === "string") {
        if (options.length === 0) options = "No Options";
    } else options = "Unknown Command";

    const command = slashCommandMentionName.exec(mention)?.[1] ?? "Unknown Command";

    return (
        <Tooltip text={options}>
            {({ onMouseEnter, onMouseLeave }) => (
                // @ts-ignore
                <span className="wrapper_f46140 interactive" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={() => slashCommandMentionClick(command, options)}>
                    /<span>{command}</span>
                </span>
            )}
        </Tooltip>
    );
};

function insertMentions(content) {
    const used: any[] = [];

    content = content.reduce((acc, curr) => {
        if (curr.type === "span" && acc.length > 0 && acc[acc.length - 1].type === "span" && !used.includes(curr.props.children)) {
            acc[acc.length - 1].props.children += curr.props.children;
            used.push(curr.props.children);
        } else acc.push(curr);

        return acc;
    }, []);

    return content.filter(e => e).reduce((acc, item) => {
        if (item.type === "span") {
            const parts: any[] = [];
            const text = item.props.children;

            let lastIndex = 0;

            text.replace(slashCommandMention, (match, p1, offset) => {
                if (offset > lastIndex) {
                    const target = text.substring(lastIndex, offset);
                    const separated = target.split(new RegExp(`(.*?)(${slashCommandMention.source})(.*?)(?=${slashCommandMention.source}|$)`, "gu")).filter(matched => matched && matched !== p1 && matched !== offset);

                    separated.forEach((part, i) => {
                        if (i % 2 === 0) parts.push(part);
                        else parts.push({
                            mention: SlashCommandMentionTag(part)
                        });
                    });
                }

                lastIndex = offset + match.length;
            });

            if (lastIndex < text.length) parts.push(text.substring(lastIndex));

            parts.forEach(part => acc.push(part.mention ?? (
                <span>
                    {part}
                </span>
            )));
        } else acc.push(item);

        return acc;
    }, []);
}

export default definePlugin({
    name: "SlashCommandMentionOptions",
    authors: [Devs.Tolgchu],
    description: "Adds option support to slash command mentions. WARNING: THIS PLUGIN IS EXPERIMENTAL AND HAS MANY BUGS. USE AT YOUR OWN RISK.",
    patches: [
        {
            find: ".Messages.MESSAGE_EDITED,",
            replacement: [
                {
                    match: /let\{className:\i,message:\i[^}]*\}=(\i)/,
                    replace: "if($1&&$1.message&&$1.message.content)$1.content=$self.insertMentions($1.content);$&"
                }
            ]
        }
    ],
    insertMentions,
    start: () => { },
    stop: () => { }
});
