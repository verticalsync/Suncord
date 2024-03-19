/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Native } from "..";

const USERNAME_ENDPOINT = "https://users.roblox.com/v1/usernames/users";
const USER_PROFILE_ENDPOINT = "https://users.roblox.com/v1/users/";
const AVATAR_ENDPOINT = "https://www.roblox.com/avatar-thumbnails?params=[{userId:%ID%}]";

export interface RobloxUserProfile {
    description: string;
    created: string;
    isBanned: boolean;
    externalAppDisplayName: any;
    hasVerifiedBadge: boolean;
    id: number;
    name: string;
    displayName: string;
}

export interface TaxCalculation {
    grossAmount: number;
    taxAmount: number;
    netAmount: number;
}

export function calculateRobloxTax(amount: number, tax = 30): TaxCalculation {
    const taxAmount = (amount * tax) / 100;
    const netAmount = amount - taxAmount;
    return {
        grossAmount: amount,
        taxAmount: taxAmount,
        netAmount: netAmount
    };
}

export async function getUserID(username: string): Promise<number> {
    let userID = 0;

    await Native.postRequest(USERNAME_ENDPOINT, {
        usernames: [username],
        excludeBannedUsers: true
    }).then(data => {
        if (data.data[0])
            userID = data.data[0].id;
    });

    return userID;
}

export async function getUserProfile(userid: number): Promise<RobloxUserProfile | undefined> {
    let userProfile;

    await Native.getRequest(USER_PROFILE_ENDPOINT + userid).then(data => {
        userProfile = data;
    });

    return userProfile;
}

export async function getProfilePicture(userid: number): Promise<string | undefined> {
    let profilePicture;

    await Native.getRequest(AVATAR_ENDPOINT.replace("%ID%", userid.toString())).then(data => {
        if (data[0])
            profilePicture = data[0].thumbnailUrl;
    });

    return profilePicture;
}
