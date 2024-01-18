/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { DataStore } from "@api/index";
import { definePluginSettings } from "@api/Settings";
import { Flex } from "@components/Flex";
import { DeleteIcon } from "@components/Icons";
import { useForceUpdater } from "@utils/react";
import { OptionType } from "@utils/types";
import { Button, Forms, React, TextInput, useState } from "@webpack/common";

import { DATASTORE_KEY, userWhitelist } from ".";

export const settings = definePluginSettings({
    whitelistedUsers: {
        type: OptionType.COMPONENT,
        component: () => {
            const update = useForceUpdater();
            return (<WhitelistedUsersComponent update={update} />);
        },
        description: "Users that will bypass DND mode",
    }

});


function Input({ initialValue, onChange, placeholder }: {
    placeholder: string;
    initialValue: string;
    onChange(value: string): void;
}) {
    const [value, setValue] = useState(initialValue);
    return (
        <TextInput
            placeholder={placeholder}
            value={value}
            onChange={setValue}
            spellCheck={false}
            onBlur={() => value !== initialValue && onChange(value)}
        />
    );
}

function WhitelistedUsersComponent(props: { update: () => void; }) {
    const { update } = props;

    async function onClickRemove(index: number) {
        userWhitelist.splice(index, 1);

        await DataStore.set(DATASTORE_KEY, userWhitelist);
        update();
    }

    async function onChange(e: string, index: number) {
        if (index === userWhitelist.length - 1)
            userWhitelist.push("");

        userWhitelist[index] = e;

        if (index !== userWhitelist.length - 1)
            userWhitelist.splice(index, 1);

        await DataStore.set(DATASTORE_KEY, userWhitelist);
        update();
    }

    return (
        <>
            <Forms.FormTitle tag="h4">Users to get whitelisted</Forms.FormTitle>
            <Flex flexDirection="column" style={{ gap: "0.5em" }}>
                {
                    userWhitelist.map((user, index) =>
                        <React.Fragment key={`${user}`}>
                            <Flex flexDirection="row" style={{ gap: 0, flexGrow: 1 }}>

                                <Input
                                    placeholder="User ID"
                                    initialValue={user}
                                    onChange={e => onChange(e, index)}
                                />

                                <Button
                                    size={Button.Sizes.MIN}
                                    onClick={() => onClickRemove(index)}
                                    style={{
                                        background: "none",
                                        color: "var(--status-danger)"
                                    }}
                                >
                                    <DeleteIcon />
                                </Button>
                            </Flex>
                        </React.Fragment>
                    )
                }
            </Flex>
        </>
    );
}
