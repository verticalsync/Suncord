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

import { useState } from "@webpack/common";

import { Spotify } from "../api";
import { useAwaiter } from "./useAwaiter";

export function useQueue(cooldown: number) {
    const [trackId, setTrackId] = useState<string | null>(null);

    const [completed, error, pending] = useAwaiter(async () => {
        if (!trackId) return false;
        await Spotify.queue(trackId);
        setTimeout(() => setTrackId(null), cooldown);
        return true;
    }, {
        fallbackValue: false,
        deps: [trackId],
    });

    return [completed, pending, error, setTrackId] as const;
}
