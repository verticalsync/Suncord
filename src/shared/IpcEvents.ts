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

export const enum IpcEvents {
    QUICK_CSS_UPDATE = "SuncordQuickCssUpdate",
    THEME_UPDATE = "SuncordThemeUpdate",
    GET_QUICK_CSS = "SuncordGetQuickCss",
    SET_QUICK_CSS = "SuncordSetQuickCss",
    UPLOAD_THEME = "SuncordUploadTheme",
    DELETE_THEME = "SuncordDeleteTheme",
    GET_THEMES_DIR = "SuncordGetThemesDir",
    GET_THEMES_LIST = "SuncordGetThemesList",
    GET_THEME_DATA = "SuncordGetThemeData",
    GET_THEME_SYSTEM_VALUES = "SuncordGetThemeSystemValues",
    GET_SETTINGS_DIR = "SuncordGetSettingsDir",
    GET_SETTINGS = "SuncordGetSettings",
    SET_SETTINGS = "SuncordSetSettings",
    OPEN_EXTERNAL = "SuncordOpenExternal",
    OPEN_QUICKCSS = "SuncordOpenQuickCss",
    GET_UPDATES = "SuncordGetUpdates",
    GET_REPO = "SuncordGetRepo",
    UPDATE = "SuncordUpdate",
    BUILD = "SuncordBuild",
    OPEN_MONACO_EDITOR = "SuncordOpenMonacoEditor",

    GET_PLUGIN_IPC_METHOD_MAP = "SuncordGetPluginIpcMethodMap",

    OPEN_IN_APP__RESOLVE_REDIRECT = "SuncordOIAResolveRedirect",
    VOICE_MESSAGES_READ_RECORDING = "SuncordVMReadRecording",
}
