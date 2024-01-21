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

import { settings } from "../settings";
import { Album, DisplayResource, ResourceType, RestrictionReason, Track } from "../types";

export function formatReleaseDate(dateStr: string) {
    const [year, month, day] = dateStr.split("-") as [string, string?, string?];

    const dateFormat = new Intl.DateTimeFormat(void 0, {
        year: "numeric",
        month: month != null ? (settings.store.numericMonth ? "numeric" : "long") : void 0,
        day: day != null ? "numeric" : void 0,
    });

    const date = new Date();
    date.setFullYear(+year);
    if (month) date.setMonth(+month - 1);
    if (day) date.setDate(+day);
    return dateFormat.format(date);
}

export function getAlbumType(album: Album) {
    // https://support.cdbaby.com/hc/en-us/articles/360008275672-What-is-the-difference-between-Single-EP-and-Albums-
    if (album.album_type === "single")
        return album.tracks.total >= 4 ? "EP" : "Single";
    if (album.album_type === "compilation") return "Compilation";
    return "Album";
}

export function getTracks(resource: DisplayResource): Track[] | null {
    switch (resource.type) {
        case ResourceType.Album: return resource.tracks.items;

        case ResourceType.Playlist: return resource.tracks.items.map(item => item.track).filter((track): track is Track => track != null);

        case ResourceType.Artist: return resource.tracks;
    }
    return null;
}

export function getReason(reason: string): string {
    switch (reason) {
        case RestrictionReason.Explicit: return "it's explicit";
        case RestrictionReason.Market: return "it isn't available in your country/market";
        case RestrictionReason.Product: return "it isn't available with your Spotify subscription";
        default: return `it's unavailable "${reason}"`;
    }
}

export function getSelectedTrack(resource: DisplayResource, trackIndex: number): Track | null {
    switch (resource.type) {
        case ResourceType.Track: return resource;

        case ResourceType.Album: return resource.tracks.items[trackIndex];

        case ResourceType.Playlist: return resource.tracks.items[trackIndex]?.track;

        case ResourceType.Artist: return resource.tracks[trackIndex];
    }
    return null;
}

export const MARKET_CODES = "AD AE AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ CA CD CG CH CI CL CM CO CR CV CW CY CZ DE DJ DK DM DO DZ EC EE EG ES ET FI FJ FM FR GA GB GD GE GH GM GN GQ GR GT GW GY HK HN HR HT HU ID IE IL IN IQ IS IT JM JO JP KE KG KH KI KM KN KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MN MO MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NR NZ OM PA PE PG PH PK PL PS PT PW PY QA RO RS RW SA SB SC SE SG SI SK SL SM SN SR ST SV SZ TD TG TH TJ TL TN TO TR TT TV TW TZ UA UG US UY UZ VC VE VN VU WS XK ZA ZM ZW".split(" ");

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
export function getMarketName(code: string) {
    return regionNames.of(code);
}
