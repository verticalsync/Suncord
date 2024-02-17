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

import "./messageLogger.css";

import { addContextMenuPatch, NavContextMenuPatchCallback, removeContextMenuPatch } from "@api/ContextMenu";
import { Settings } from "@api/Settings";
import { disableStyle, enableStyle } from "@api/Styles";
import ErrorBoundary from "@components/ErrorBoundary";
import { Devs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { ChannelStore, FluxDispatcher, i18n, Menu, Parser, Timestamp, UserStore } from "@webpack/common";

import overlayStyle from "./deleteStyleOverlay.css?managed";
import textStyle from "./deleteStyleText.css?managed";

const styles = findByPropsLazy("edited", "communicationDisabled", "isSystemMessage");

function addDeleteStyle() {
    if (Settings.plugins.MessageLogger.deleteStyle === "text") {
        enableStyle(textStyle);
        disableStyle(overlayStyle);
    } else {
        disableStyle(textStyle);
        enableStyle(overlayStyle);
    }
}

const REMOVE_HISTORY_ID = "ml-remove-history";
const TOGGLE_DELETE_STYLE_ID = "ml-toggle-style";
const patchMessageContextMenu: NavContextMenuPatchCallback = (children, props) => () => {
    const { message } = props;
    const { deleted, editHistory, id, channel_id } = message;

    if (!deleted && !editHistory?.length) return;

    toggle: {
        if (!deleted) break toggle;

        const domElement = document.getElementById(`chat-messages-${channel_id}-${id}`);
        if (!domElement) break toggle;

        children.push((
            <Menu.MenuItem
                id={TOGGLE_DELETE_STYLE_ID}
                key={TOGGLE_DELETE_STYLE_ID}
                label="Toggle Deleted Highlight"
                action={() => domElement.classList.toggle("messagelogger-deleted")}
            />
        ));
    }

    children.push((
        <Menu.MenuItem
            id={REMOVE_HISTORY_ID}
            key={REMOVE_HISTORY_ID}
            label="Remove Message History"
            color="danger"
            action={() => {
                if (deleted) {
                    FluxDispatcher.dispatch({
                        type: "MESSAGE_DELETE",
                        channelId: channel_id,
                        id,
                        mlDeleted: true
                    });
                } else {
                    message.editHistory = [];
                }
            }}
        />
    ));
};

export default definePlugin({
    name: "MessageLogger",
    description: "Temporarily logs deleted and edited messages.",
    authors: [Devs.rushii, Devs.Ven, Devs.AutumnVN],

    start() {
        addDeleteStyle();
        addContextMenuPatch("message", patchMessageContextMenu);
    },

    stop() {
        removeContextMenuPatch("message", patchMessageContextMenu);
    },

    renderEdit(edit: { timestamp: any, content: string; }) {
        return (
            <ErrorBoundary noop>
                <div className="messagelogger-edited">
                    {Parser.parse(edit.content)}
                    <Timestamp
                        timestamp={edit.timestamp}
                        isEdited={true}
                        isInline={false}
                    >
                        <span className={styles.edited}>{" "}({i18n.Messages.MESSAGE_EDITED})</span>
                    </Timestamp>
                </div>
            </ErrorBoundary>
        );
    },

    makeEdit(newMessage: any, oldMessage: any): any {
        return {
            timestamp: new Date(newMessage.edited_timestamp),
            content: oldMessage.content
        };
    },

    options: {
        deleteStyle: {
            type: OptionType.SELECT,
            description: "The style of deleted messages",
            default: "text",
            options: [
                { label: "Red text", value: "text", default: true },
                { label: "Red overlay", value: "overlay" }
            ],
            onChange: () => addDeleteStyle()
        },
        ignoreBots: {
            type: OptionType.BOOLEAN,
            description: "Whether to ignore messages by bots",
            default: false
        },
        ignoreSelf: {
            type: OptionType.BOOLEAN,
            description: "Whether to ignore messages by yourself",
            default: false
        },
        ignoreUsers: {
            type: OptionType.STRING,
            description: "Comma-separated list of user IDs to ignore",
            default: ""
        },
        ignoreChannels: {
            type: OptionType.STRING,
            description: "Comma-separated list of channel IDs to ignore",
            default: ""
        },
        ignoreGuilds: {
            type: OptionType.STRING,
            description: "Comma-separated list of guild IDs to ignore",
            default: ""
        },
    },

    handleDelete(cache: any, data: { ids: string[], id: string; mlDeleted?: boolean; }, isBulk: boolean) {
        try {
            if (cache == null || (!isBulk && !cache.has(data.id))) return cache;

            const mutate = (id: string) => {
                const msg = cache.get(id);
                if (!msg) return;

                const EPHEMERAL = 64;
                const shouldIgnore = data.mlDeleted ||
                    (msg.flags & EPHEMERAL) === EPHEMERAL ||
                    this.shouldIgnore(msg);

                if (shouldIgnore) {
                    cache = cache.remove(id);
                } else {
                    cache = cache.update(id, m => m
                        .set("deleted", true)
                        .set("attachments", m.attachments.map(a => (a.deleted = true, a))));
                }
            };

            if (isBulk) {
                data.ids.forEach(mutate);
            } else {
                mutate(data.id);
            }
        } catch (e) {
            new Logger("MessageLogger").error("Error during handleDelete", e);
        }
        return cache;
    },

    shouldIgnore(message: any) {
        const { ignoreBots, ignoreSelf, ignoreUsers, ignoreChannels, ignoreGuilds } = Settings.plugins.MessageLogger;
        const myId = UserStore.getCurrentUser().id;

        return ignoreBots && message.author?.bot ||
            ignoreSelf && message.author?.id === myId ||
            ignoreUsers.includes(message.author?.id) ||
            ignoreChannels.includes(message.channel_id) ||
            ignoreChannels.includes(ChannelStore.getChannel(message.channel_id)?.parent_id) ||
            ignoreGuilds.includes(ChannelStore.getChannel(message.channel_id)?.guild_id);
    },

    // Based on canary 63b8f1b4f2025213c5cf62f0966625bee3d53136
    patches: [
        {
            // MessageStore
            // Module 171447
            find: "displayName=\"MessageStore\"",
            replacement: [
                {
                    // Add deleted=true to all target messages in the MESSAGE_DELETE event
                    match: /MESSAGE_DELETE:function\((\i)\){let.+?((?:\i\.){2})getOrCreate.+?},/,
                    replace:
                        "MESSAGE_DELETE:function($1){" +
                        "   var cache = $2getOrCreate($1.channelId);" +
                        "   cache = $self.handleDelete(cache, $1, false);" +
                        "   $2commit(cache);" +
                        "},"
                },
                {
                    // Add deleted=true to all target messages in the MESSAGE_DELETE_BULK event
                    match: /MESSAGE_DELETE_BULK:function\((\i)\){let.+?((?:\i\.){2})getOrCreate.+?},/,
                    replace:
                        "MESSAGE_DELETE_BULK:function($1){" +
                        "   var cache = $2getOrCreate($1.channelId);" +
                        "   cache = $self.handleDelete(cache, $1, true);" +
                        "   $2commit(cache);" +
                        "},"
                },
                {
                    // Add current cached content + new edit time to cached message's editHistory
                    match: /(MESSAGE_UPDATE:function\((\i)\).+?)\.update\((\i)/,
                    replace: "$1" +
                        ".update($3,m =>" +
                        "   (($2.message.flags & 64) === 64 || $self.shouldIgnore($2.message)) ? m :" +
                        "   $2.message.content !== m.editHistory?.[0]?.content && $2.message.content !== m.content ?" +
                        "       m.set('editHistory',[...(m.editHistory || []), $self.makeEdit($2.message, m)]) :" +
                        "       m" +
                        ")" +
                        ".update($3"
                },
                {
                    // fix up key (edit last message) attempting to edit a deleted message
                    match: /(?<=getLastEditableMessage\(\i\)\{.{0,200}\.find\((\i)=>)/,
                    replace: "!$1.deleted &&"
                }
            ]
        },

        {
            // Message domain model
            // Module 451
            find: "}addReaction(",
            replacement: [
                {
                    match: /this\.customRenderedContent=(\i)\.customRenderedContent,/,
                    replace: "this.customRenderedContent = $1.customRenderedContent," +
                        "this.deleted = $1.deleted || false," +
                        "this.editHistory = $1.editHistory || [],"
                }
            ]
        },

        {
            // Updated message transformer(?)
            // Module 819525
            find: "THREAD_STARTER_MESSAGE?null===",
            replacement: [
                // {
                //     // DEBUG: Log the params of the target function to the patch below
                //     match: /function N\(e,t\){/,
                //     replace: "function L(e,t){console.log('pre-transform', e, t);"
                // },
                {
                    // Pass through editHistory & deleted & original attachments to the "edited message" transformer
                    match: /interactionData:(\i)\.interactionData/,
                    replace:
                        "interactionData:$1.interactionData," +
                        "deleted:$1.deleted," +
                        "editHistory:$1.editHistory," +
                        "attachments:$1.attachments"
                },

                // {
                //     // DEBUG: Log the params of the target function to the patch below
                //     match: /function R\(e\){/,
                //     replace: "function R(e){console.log('after-edit-transform', arguments);"
                // },
                {
                    // Construct new edited message and add editHistory & deleted (ref above)
                    // Pass in custom data to attachment parser to mark attachments deleted as well
                    match: /attachments:(\i)\((\i)\)/,
                    replace:
                        "attachments: $1((() => {" +
                        "   if ($self.shouldIgnore($2)) return $2;" +
                        "   let old = arguments[1]?.attachments;" +
                        "   if (!old) return $2;" +
                        "   let new_ = $2.attachments?.map(a => a.id) ?? [];" +
                        "   let diff = old.filter(a => !new_.includes(a.id));" +
                        "   old.forEach(a => a.deleted = true);" +
                        "   $2.attachments = [...diff, ...$2.attachments];" +
                        "   return $2;" +
                        "})())," +
                        "deleted: arguments[1]?.deleted," +
                        "editHistory: arguments[1]?.editHistory"
                },
                {
                    // Preserve deleted attribute on attachments
                    match: /(\((\i)\){return null==\2\.attachments.+?)spoiler:/,
                    replace:
                        "$1deleted: arguments[0]?.deleted," +
                        "spoiler:"
                }
            ]
        },

        {
            // Attachment renderer
            // Module 96063
            find: ".removeAttachmentHoverButton",
            group: true,
            replacement: [
                {
                    match: /(className:\i,attachment:\i),/,
                    replace: "$1,attachment: {deleted},"
                },
                {
                    match: /\[\i\.obscured\]:.+?,/,
                    replace: "$& 'messagelogger-deleted-attachment': deleted,"
                }
            ]
        },

        {
            // Base message component renderer
            // Module 748241
            find: "Message must not be a thread starter message",
            replacement: [
                {
                    // Append messagelogger-deleted to classNames if deleted
                    match: /\)\("li",\{(.+?),className:/,
                    replace: ")(\"li\",{$1,className:(arguments[0].message.deleted ? \"messagelogger-deleted \" : \"\")+"
                }
            ]
        },

        {
            // Message content renderer
            // Module 43016
            find: "Messages.MESSAGE_EDITED,\")\"",
            replacement: [
                {
                    // Render editHistory in the deepest div for message content
                    match: /(\)\("div",\{id:.+?children:\[)/,
                    replace: "$1 (arguments[0].message.editHistory?.length > 0 ? arguments[0].message.editHistory.map(edit => $self.renderEdit(edit)) : null), "
                }
            ]
        },

        {
            // ReferencedMessageStore
            // Module 778667
            find: "displayName=\"ReferencedMessageStore\"",
            replacement: [
                {
                    match: /MESSAGE_DELETE:function\((\i)\).+?},/,
                    replace: "MESSAGE_DELETE:function($1){},"
                },
                {
                    match: /MESSAGE_DELETE_BULK:function\((\i)\).+?},/,
                    replace: "MESSAGE_DELETE_BULK:function($1){},"
                }
            ]
        },

        {
            // Message context base menu
            // Module 600300
            find: "useMessageMenu:",
            replacement: [
                {
                    // Remove the first section if message is deleted
                    match: /children:(\[""===.+?\])/,
                    replace: "children:arguments[0].message.deleted?[]:$1"
                }
            ]
        }

        // {
        //     // MessageStore caching internals
        //     // Module 819525
        //     find: "e.getOrCreate=function(t)",
        //     replacement: [
        //         // {
        //         //     // DEBUG: log getOrCreate return values from MessageStore caching internals
        //         //     match: /getOrCreate=function(.+?)return/,
        //         //     replace: "getOrCreate=function$1console.log('getOrCreate',n);return"
        //         // }
        //     ]
        // }
    ]
});
