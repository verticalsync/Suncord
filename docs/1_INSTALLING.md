> [!WARNING]
> These instructions are only for advanced users. If you're not a Developer, you should use our [graphical installer](https://github.com/verticalsync/SuncordInstaller/releases) instead.
> No support will be provided for installing in this fashion. If you cannot figure it out, you should just stick to a regular install.

# Installation Guide

Welcome to Megu's Installation Guide! In this file, you will learn about how to download, install, and uninstall Suncord!

## Sections

-   [Installation Guide](#installation-guide)
    -   [Sections](#sections)
    -   [Dependencies](#dependencies)
    -   [Installing Suncord](#installing-Suncord)
    -   [Updating Suncord](#updating-Suncord)
    -   [Uninstalling Suncord](#uninstalling-Suncord)

## Dependencies

-   Install Git from https://git-scm.com/download
-   Install Node.JS LTS from here: https://nodejs.dev/en/

## Installing Suncord

Install `pnpm`:

> :exclamation: This next command may need to be run as admin/root depending on your system, and you may need to close and reopen your terminal for pnpm to be in your PATH.

```shell
npm i -g pnpm
```

> :exclamation: **IMPORTANT** Make sure you aren't using an admin/root terminal from here onwards. It **will** mess up your Discord/Suncord instance and you **will** most likely have to reinstall.

Clone Suncord:

```shell
git clone https://github.com/verticalsync/Suncord
cd Suncord
```

Install dependencies:

```shell
pnpm install --frozen-lockfile
```

Build Suncord:

```shell
pnpm build
```

Inject Suncord into your client:

```shell
pnpm inject
```

Then fully close Discord from your taskbar or task manager, and restart it. Suncord should be injected - you can check this by looking for the Suncord section in Discord settings.

## Updating Suncord

If you're using Discord already, go into the `Updater` tab in settings.

Sometimes it may be necessary to manually update if the GUI updater fails.

To pull latest changes:

```shell
git pull
```

If this fails, you likely need to reset your local changes to suncord to resolve merge errors:

> :exclamation: This command will remove any local changes you've made to suncord. Make sure you back up if you made any code changes you don't want to lose!

```shell
git reset --hard
git pull
```

and then to build the changes:

```shell
pnpm build
```

Then just refresh your client

## Uninstalling Suncord

Simply run:

```shell
pnpm uninject
```

If you need more help, ask in the support channel in our [Discord Server](https://discord.gg/VasF3Ma4Ab).
