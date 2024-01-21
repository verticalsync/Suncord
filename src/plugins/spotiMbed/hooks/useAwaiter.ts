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

import { useEffect, useState } from "@webpack/common";

type AwaiterRes<T> = [T, any, boolean];
interface AwaiterOpts<T> {
    fallbackValue: T,
    deps?: unknown[],
    onError?(e: any): void,
    /**
     * Whether the awaiter should skip fetching, using only the fallback value.
     * Useful for preventing unnecessary renders when the value is cached.
     */
    skipFetch?: boolean,
}
/**
 * Await a promise
 * @param factory Factory
 * @param fallbackValue The fallback value that will be used until the promise resolved
 * @returns [value, error, isPending]
 */
export function useAwaiter<T>(factory: () => Promise<T>): AwaiterRes<T | null>;
export function useAwaiter<T>(factory: () => Promise<T>, providedOpts: AwaiterOpts<T>): AwaiterRes<T>;
export function useAwaiter<T>(factory: () => Promise<T>, providedOpts?: AwaiterOpts<T | null>): AwaiterRes<T | null> {
    const opts: Required<AwaiterOpts<T | null>> = Object.assign({
        fallbackValue: null,
        deps: [],
        onError: null,
        skipFetch: false,
    }, providedOpts);
    const [state, setState] = useState({
        value: opts.fallbackValue,
        error: null,
        pending: !opts.skipFetch,
    });

    useEffect(() => {
        let isAlive = true;

        if (!opts.skipFetch) {
            if (!state.pending) setState({ ...state, pending: true });

            factory()
                .then(value => isAlive && setState({ value, error: null, pending: false }))
                .catch(error => isAlive && (setState({ value: null, error, pending: false }), opts.onError?.(error)));
        }

        return () => void (isAlive = false);
    }, opts.deps);

    return [state.value, state.error, state.pending];
}
