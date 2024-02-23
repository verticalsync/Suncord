/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import * as DataStore from "@api/DataStore";
import { Settings } from "@api/Settings";
import { UserStore } from "@webpack/common";

import { DEFAULT_COLOR } from "./constants";

export interface Category {
    id: string;
    name: string;
    color: number;
    channels: string[];
    colapsed?: boolean;
}

export const KEYS = {
    CATEGORY_BASE_KEY: "BetterPinDMsCategories-",
    CATEGORY_MIGRATED_PINDMS_KEY: "BetterPinDMsMigratedPinDMs",
    CATEGORY_MIGRATED_KEY: "BetterPinDMsMigratedOldCategories",
    OLD_CATEGORY_KEY: "betterPinDmsCategories"
};

export let categories: Category[] = [];

export async function saveCats(cats: Category[]) {
    const { id } = UserStore.getCurrentUser();
    await DataStore.set(KEYS.CATEGORY_BASE_KEY + id, cats);
}

export async function initCategories(userId: string) {
    return categories = await DataStore.get<Category[]>(KEYS.CATEGORY_BASE_KEY + userId) ?? [];
}

export function getCategory(id: string) {
    return categories.find(c => c.id === id);
}

export async function createCategory(category: Category) {
    categories.push(category);
    saveCats(categories);
}

export async function updateCategory(category: Category) {
    const index = categories.findIndex(c => c.id === category.id);
    if (index === -1) return;

    categories[index] = category;
    saveCats(categories);
}

export async function addChannelToCategory(channelId: string, categoryId: string) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    if (category.channels.includes(channelId)) return;

    category.channels.push(channelId);
    saveCats(categories);

}

export async function removeChannelFromCategory(channelId: string) {
    const category = categories.find(c => c.channels.includes(channelId));
    if (!category) return;

    category.channels = category.channels.filter(c => c !== channelId);
    saveCats(categories);
}

export async function removeCategory(categoryId: string) {
    const catagory = categories.find(c => c.id === categoryId);
    if (!catagory) return;

    catagory?.channels.forEach(c => removeChannelFromCategory(c));
    categories = categories.filter(c => c.id !== categoryId);
    saveCats(categories);
}

export function isPinned(id: string) {
    return categories.some(c => c.channels.includes(id));
}

export const canMoveCategoryInDirection = (id: string, direction: -1 | 1) => {
    const a = categories.map(m => m.id).indexOf(id);
    const b = a + direction;

    return categories[a] && categories[b];
};

export const canMoveCategory = (id: string) => canMoveCategoryInDirection(id, -1) || canMoveCategoryInDirection(id, 1);

// stolen from PinDMs
export async function moveCategory(id: string, direction: -1 | 1) {
    const a = categories.map(m => m.id).indexOf(id);
    const b = a + direction;

    if (!categories[a] || !categories[b]) return;

    [categories[a], categories[b]] = [categories[b], categories[a]];

    saveCats(categories);
}

export async function collapseCategory(id: string, value = true) {
    const category = categories.find(c => c.id === id);
    if (!category) return;

    category.colapsed = value;
    saveCats(categories);
}


const getPinDMsPins = () => (Settings.plugins.PinDMs.pinnedDMs || void 0)?.split(",") as string[] | undefined;

async function migratePinDMs() {
    if (categories.some(m => m.id === "oldPins")) {
        return await DataStore.set(KEYS.CATEGORY_MIGRATED_PINDMS_KEY, true);
    }

    const pindmspins = getPinDMsPins();

    // we dont want duplicate pins
    const difference = [...new Set(pindmspins)]?.filter(m => !categories.some(c => c.channels.includes(m)));
    if (difference?.length) {
        categories.push({
            id: "oldPins",
            name: "Pins",
            color: DEFAULT_COLOR,
            channels: difference
        });
    }

    await DataStore.set(KEYS.CATEGORY_MIGRATED_PINDMS_KEY, true);
}

async function migrateOldCategories() {
    const oldCats = await DataStore.get<Category[]>(KEYS.OLD_CATEGORY_KEY);
    // dont want to migrate if the user has already has categories.
    if (categories.length === 0 && oldCats?.length) {
        categories.push(...(oldCats.filter(m => m.id !== "oldPins")));
    }
    await DataStore.set(KEYS.CATEGORY_MIGRATED_KEY, true);
}

export async function migrateData() {
    const m1 = await DataStore.get(KEYS.CATEGORY_MIGRATED_KEY), m2 = await DataStore.get(KEYS.CATEGORY_MIGRATED_PINDMS_KEY);
    if (m1 && m2) return;

    // want to migrate the old categories first and then slove any conflicts with the PinDMs pins
    if (!m1) await migrateOldCategories();
    if (!m2) await migratePinDMs();

    await saveCats(categories);
}
