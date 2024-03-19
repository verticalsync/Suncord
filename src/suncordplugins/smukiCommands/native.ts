/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import https from "https";

interface JsonResponse {
    [key: string]: any;
}

export function createRequest(_, method: string, url: string, body?: object): Promise<JsonResponse> {
    return new Promise((resolve, reject) => {
        const options: https.RequestOptions = {
            method: method.toUpperCase(),
            headers: {
                "Content-Type": "application/json",
            }
        };

        const req = https.request(url, options, res => {
            let data = "";
            res.on("data", chunk => {
                data += chunk;
            });
            res.on("end", () => {
                try {
                    const jsonData: JsonResponse = JSON.parse(data);
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on("error", error => {
            reject(error);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }

        req.end();
    });
}

export async function getRequest(_, url: string): Promise<JsonResponse> {
    return await createRequest(_, "GET", url);
}

export async function postRequest(_, url: string, body: object): Promise<JsonResponse> {
    return await createRequest(_, "POST", url, body);
}

export async function putRequest(_, url: string, body: object): Promise<JsonResponse> {
    return await createRequest(_, "PUT", url, body);
}

export async function deleteRequest(_, url: string): Promise<JsonResponse> {
    return await createRequest(_, "DELETE", url);
}

export async function patchRequest(_, url: string, body: object): Promise<JsonResponse> {
    return await createRequest(_, "PATCH", url, body);
}

export async function optionsRequest(_, url: string): Promise<JsonResponse> {
    return await createRequest(_, "OPTIONS", url);
}
