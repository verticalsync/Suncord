/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";
import { Text, useEffect, UserStore, useState } from "@webpack/common";

const settings = definePluginSettings({
    showSuncordDonor: {
        type: OptionType.BOOLEAN,
        description: "Enable to show Suncord Donor badges in chat.",
        hidden: true,
        default: true
    },
    SuncordDonorPosition: {
        type: OptionType.NUMBER,
        description: "The position of the Suncord Donor badges.",
        hidden: true,
        default: 0
    },
    showSuncordContributor: {
        type: OptionType.BOOLEAN,
        description: "Enable to show Suncord Contributor badges in chat.",
        hidden: true,
        default: true
    },
    SuncordContributorPosition: {
        type: OptionType.NUMBER,
        description: "The position of the Suncord Contributor badge.",
        hidden: true,
        default: 1
    },
    showVencordDonor: {
        type: OptionType.BOOLEAN,
        description: "Enable to show Vencord Donor badges in chat.",
        hidden: true,
        default: true
    },
    VencordDonorPosition: {
        type: OptionType.NUMBER,
        description: "The position of the Vencord Donor badges.",
        hidden: true,
        default: 2
    },
    showVencordContributor: {
        type: OptionType.BOOLEAN,
        description: "Enable to show Vencord Contributor badges in chat.",
        hidden: true,
        default: true
    },
    VencordContributorPosition: {
        type: OptionType.NUMBER,
        description: "The position of the Vencord Contributor badge.",
        hidden: true,
        default: 3
    },
    showDiscordProfile: {
        type: OptionType.BOOLEAN,
        description: "Enable to show Discord profile badges in chat.",
        hidden: true,
        default: true
    },
    DiscordProfilePosition: {
        type: OptionType.NUMBER,
        description: "The position of the Discord profile badges.",
        hidden: true,
        default: 4
    },
    showDiscordNitro: {
        type: OptionType.BOOLEAN,
        description: "Enable to show Discord Nitro badges in chat.",
        hidden: true,
        default: true
    },
    DiscordNitroPosition: {
        type: OptionType.NUMBER,
        description: "The position of the Discord Nitro badge.",
        hidden: true,
        default: 5
    },
    badgeSettings: {
        type: OptionType.COMPONENT,
        description: "Setup badge layout and visibility",
        component: () => <BadgeSettings />
    }
});

export default settings;

const BadgeSettings = () => {
    const [images, setImages] = useState([
        { src: "https://i.imgur.com/H3GPhpd.png", shown: settings.store.showSuncordDonor, title: "Suncord donor badges", key: "SuncordDonor", position: settings.store.SuncordDonorPosition },
        { src: "https://raw.githubusercontent.com/verticalsync/Suncord/main/src/assets/icon.png", shown: settings.store.showSuncordContributor, title: "Suncord contributor badge", key: "SuncordContributer", position: settings.store.SuncordContributorPosition },
        { src: "https://cdn.discordapp.com/emojis/1026533070955872337.png", shown: settings.store.showVencordDonor, title: "Vencord donor badges", key: "VencordDonor", position: settings.store.VencordDonorPosition },
        { src: "https://vencord.dev/assets/favicon.png", shown: settings.store.showVencordContributor, title: "Vencord contributor badge", key: "VencordContributer", position: settings.store.VencordContributorPosition },
        { src: "https://cdn.discordapp.com/badge-icons/bf01d1073931f921909045f3a39fd264.png", shown: settings.store.showDiscordProfile, title: "Discord profile badges (HypeSquad, Discord Staff, Active Developer, etc.)", key: "DiscordProfile", position: settings.store.DiscordProfilePosition },
        { src: "https://cdn.discordapp.com/badge-icons/2ba85e8026a8614b640c2837bcdfe21b.png", shown: settings.store.showDiscordNitro, title: "Nitro badge", key: "DiscordNitro", position: settings.store.DiscordNitroPosition }
    ]);

    useEffect(() => {
        images.forEach(image => {
            switch (image.key) {
                case "SuncordDonor":
                    settings.store.SuncordDonorPosition = image.position;
                    settings.store.showSuncordDonor = image.shown;
                    break;
                case "SuncordContributer":
                    settings.store.SuncordContributorPosition = image.position;
                    settings.store.showSuncordContributor = image.shown;
                    break;
                case "VencordDonor":
                    settings.store.VencordDonorPosition = image.position;
                    settings.store.showVencordDonor = image.shown;
                    break;
                case "VencordContributer":
                    settings.store.VencordContributorPosition = image.position;
                    settings.store.showVencordContributor = image.shown;
                    break;
                case "DiscordProfile":
                    settings.store.DiscordProfilePosition = image.position;
                    settings.store.showDiscordProfile = image.shown;
                    break;
                case "DiscordNitro":
                    settings.store.DiscordNitroPosition = image.position;
                    settings.store.showDiscordNitro = image.shown;
                    break;
                default:
                    break;
            }
        });
    }, [images]);

    const handleDragStart = (e: any, index: number) => {
        if (!images[index].shown) {
            e.preventDefault();
        } else {
            e.dataTransfer.setData("index", index);
        }
    };

    const handleDragOver = e => {
        e.preventDefault();
    };

    const handleDrop = (e: any, dropIndex: number) => {
        const dragIndex = e.dataTransfer.getData("index");
        const newImages = [...images];
        const draggedImage = newImages[dragIndex];

        newImages.splice(dragIndex, 1);
        newImages.splice(dropIndex, 0, draggedImage);

        newImages.forEach((image, index) => {
            image.position = index;
        });

        setImages(newImages);
    };

    const toggleDisable = (index: number) => {
        const newImages = [...images];
        newImages[index].shown = !newImages[index].shown;
        setImages(newImages);
    };

    return (
        <>
            <Text>Drag the badges to reorder them, you can click to enable/disable a specific badge type.</Text>
            <div className="badge-settings">
                <img style={{ width: "55px", height: "55px", borderRadius: "50%", marginRight: "15px" }} src={UserStore.getCurrentUser().getAvatarURL()}></img>
                <Text style={{ fontSize: "22px", color: "white", marginRight: "7.5px" }}>{(UserStore.getCurrentUser() as any).globalName}</Text>
                {images
                    .sort((a, b) => a.position - b.position)
                    .map((image, index) => (
                        <div
                            key={image.key}
                            className={`image-container ${!image.shown ? "disabled" : ""}`}
                            onDragOver={e => handleDragOver(e)}
                            onDrop={e => handleDrop(e, index)}
                            onClick={() => toggleDisable(index)}
                        >
                            <img
                                src={image.src}
                                alt={image.title}
                                draggable={image.shown}
                                onDragStart={e => handleDragStart(e, index)}
                                title={image.title}
                            />
                        </div>
                    ))
                }
            </div>
        </>
    );
};
