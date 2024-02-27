/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { SVGProps } from "react";

export function UnknownIcon(props: SVGProps<SVGSVGElement>) {
    return (<svg
        xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" {...props}><path fill="currentColor" fillRule="evenodd" d="M5 2a3 3 0 00-3 3v14a3 3 0 003 3h14a3 3 0 003-3V5a3 3 0 00-3-3H5zm6.81 7c-.54 0-1 .26-1.23.61A1 1 0 018.92 8.5a3.49 3.49 0 012.9-1.5c1.81 0 3.43 1.38 3.43 3.25 0 1.45-.98 2.61-2.27 3.06a1 1 0 01-1.96.37l-.19-1a1 1 0 01.98-1.18c.87 0 1.44-.63 1.44-1.25S12.68 9 11.81 9zM13 16a1 1 0 11-2 0 1 1 0 012 0zm7-10.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM18.5 20a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM7 18.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM5.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clipRule="evenodd"></path></svg>);
}
