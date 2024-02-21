/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import * as DataStore from "@api/DataStore";

export interface Category {
    id: string;
    name: string;
    color: number;
    channels: string[];
    colapsed?: boolean;
}

const CATEGORY_ID = "betterPinDmsCategories";

export let categories: Category[];

export async function getCategories() {
    if (!categories) {
        categories = await DataStore.get<Category[]>(CATEGORY_ID) ?? [];
    }
    return categories;
}
getCategories();

export function getCategory(id: string) {
    return categories.find(c => c.id === id);
}

export async function createCategory(category: Category) {
    categories.push(category);
    await DataStore.set(CATEGORY_ID, categories);
}

export async function updateCategory(category: Category) {
    const index = categories.findIndex(c => c.id === category.id);
    if (index === -1) return;

    categories[index] = category;
    await DataStore.set(CATEGORY_ID, categories);
}

export async function addChannelToCategory(channelId: string, categoryId: string) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    if (category.channels.includes(channelId)) return;

    category.channels.push(channelId);
    await DataStore.set(CATEGORY_ID, categories);

}

export async function removeChannelFromCategory(channelId: string) {
    const category = categories.find(c => c.channels.includes(channelId));
    if (!category) return;

    category.channels = category.channels.filter(c => c !== channelId);
    await DataStore.set(CATEGORY_ID, categories);
}

export async function removeCategory(categoryId: string) {
    const catagory = categories.find(c => c.id === categoryId);
    if (!catagory) return;

    catagory?.channels.forEach(c => removeChannelFromCategory(c));
    categories = categories.filter(c => c.id !== categoryId);
    await DataStore.set(CATEGORY_ID, categories);
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

    await DataStore.set(CATEGORY_ID, categories);
}

