/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import gitHash from "~git-hash";
import gitRemote from "~git-remote";

export { gitHash, gitRemote };

export const VENCORD_USER_AGENT = `Suncord/${gitHash}${gitRemote ? ` (https://github.com/${gitRemote})` : ""}`;
export const VENCORD_USER_AGENT_HASHLESS = `Suncord${gitRemote ? ` (https://github.com/${gitRemote})` : ""}`;
