/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { Forms, React } from "@webpack/common";

const ModalAPI = findByPropsLazy("openModalLazy", "useModalsStore");
const Spring = findByPropsLazy("a", "animated", "useTransition");
const AppLayer = findByPropsLazy("AppLayerContainer", "AppLayerProvider");

type Modal = {
    Layer?: any,
    instant?: boolean,
    backdropStyle?: "SUBTLE" | "DARK" | "BLUR",
};

const ANIMS = {
    SUBTLE: {
        off: { opacity: 1 },
        on: { opacity: 0.9 },
    },
    DARK: {
        off: { opacity: 1 },
        on: { opacity: 0.7 },
    },
    BLUR: {
        off: { opacity: 1, filter: "blur(0px)" },
        on: { opacity: 0.7, filter: "blur(8px)" },
    },
};

export default definePlugin({
    name: "ModalFade",
    description: "Makes modals fade the backdrop, rather than dimming",
    authors: [Devs.Kyuuhachi],

    patches: [
        {
            find: "contextMenuCallbackNative,!1",
            replacement: {
                match: /(?<=children:\[\(0,\i\.jsx\)\()"div"(?=,\{className:\i\(\i\?)/,
                replace: "$self.MainWrapper",
            }
        },
        {
            find: "{})).SUBTLE=\"SUBTLE\"",
            replacement: {
                match: /\(0,\i\.useTransition\)*/,
                replace: "$self.nullTransition"
            }
        },
    ],

    nullTransition(value: any, args: object) {
        return Spring.useTransition(value, {
            ...args,
            from: {},
            enter: { _: 0 }, // Spring gets unhappy if there's zero animations
            leave: {},
        });
    },

    MainWrapper(props: object) {
        // @ts-ignore
        const context = Forms.useModalContext();
        const modals: Modal[] = ModalAPI.useModalsStore((modals: any) => modals[context] ?? []);
        const modal = modals.findLast(modal => modal.Layer == null || modal.Layer === AppLayer.default);
        const anim = ANIMS[modal?.backdropStyle ?? "DARK"];
        const isInstant = modal?.instant;
        const prevIsInstant = usePrevious(isInstant);
        const style = Spring.useSpring({
            config: { duration: isInstant || prevIsInstant ? 0 : 300 },
            ...modal != null ? anim.on : anim.off,
        });
        return <Spring.animated.div style={style} {...props} />;
    }
});

function usePrevious<T>(value: T | undefined): T | undefined {
    const ref = React.useRef<T>();
    React.useEffect(() => {
        ref.current = value;
    }, [value]);
    return ref.current;
}
