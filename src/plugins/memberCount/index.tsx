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

import "./style.css";

import { classNameFactory } from "@api/Styles";
import ErrorBoundary from "@components/ErrorBoundary";
import { Devs } from "@utils/constants";
import { getCurrentChannel } from "@utils/discord";
import definePlugin from "@utils/types";
import { findStoreLazy } from "@webpack";
import { SelectedChannelStore, Tooltip, useEffect, useStateFromStores } from "@webpack/common";
import { FluxStore } from "@webpack/types";

import { OnlineMemberCountStore } from "./OnlineMemberCountStore";

const GuildMemberCountStore = findStoreLazy("GuildMemberCountStore") as FluxStore & { getMemberCount(guildId: string): number | null; };

const sharedIntlNumberFormat = new Intl.NumberFormat();
const numberFormat = (value: number) => sharedIntlNumberFormat.format(value);
const cl = classNameFactory("vc-membercount-");

function MemberCount({ isTooltip, tooltipGuildId }: { isTooltip?: true; tooltipGuildId?: string; }) {
    const currentChannel = useStateFromStores([SelectedChannelStore], () => getCurrentChannel());

    const guildId = isTooltip ? tooltipGuildId! : currentChannel.guild_id;

    const totalCount = useStateFromStores(
        [GuildMemberCountStore],
        () => GuildMemberCountStore.getMemberCount(guildId)
    );

    const onlineCount = useStateFromStores(
        [OnlineMemberCountStore],
        () => OnlineMemberCountStore.getCount(guildId)
    );

    useEffect(() => {
        OnlineMemberCountStore.ensureCount(guildId);
    }, [guildId]);

    if (totalCount == null)
        return null;

    return (
        <div className={cl("widget", { tooltip: isTooltip, memberList: !isTooltip })}>
            <Tooltip text={`${onlineCount != null ? numberFormat(onlineCount) : "?"} online in this channel`} position="bottom">
                {props => (
                    <div {...props}>
                        <span className={cl("online-dot")} />
                        <span className={cl("online")}>{onlineCount != null ? numberFormat(onlineCount) : "?"}</span>
                    </div>
                )}
            </Tooltip>
            <Tooltip text={`${numberFormat(totalCount)} total server members`} position="bottom">
                {props => (
                    <div {...props}>
                        <span className={cl("total-dot")} />
                        <span className={cl("total")}>{numberFormat(totalCount)}</span>
                    </div>
                )}
            </Tooltip>
        </div>
    );
}

export default definePlugin({
    name: "MemberCount",
    description: "Shows the amount of online & total members in the server member list and tooltip",
    authors: [Devs.Ven, Devs.Commandtechno],

    patches: [
        {
            find: "{isSidebarVisible:",
            replacement: {
                match: /(?<=let\{className:(\i),.+?children):\[(\i\.useMemo[^}]+"aria-multiselectable")/,
                replace: ":[$1?.startsWith('members')?$self.render():null,$2"
            }
        },
        {
            find: ".invitesDisabledTooltip",
            replacement: {
                match: /(?<=\.VIEW_AS_ROLES_MENTIONS_WARNING.{0,100})]/,
                replace: ",$self.renderTooltip(arguments[0].guild)]"
            }
        }
    ],

    render: ErrorBoundary.wrap(MemberCount, { noop: true }),
    renderTooltip: ErrorBoundary.wrap(guild => <MemberCount isTooltip tooltipGuildId={guild.id} />, { noop: true })
});
