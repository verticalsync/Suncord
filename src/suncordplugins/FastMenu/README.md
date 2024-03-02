# FastMenu
Several patches to speed up the loading of the main settings menu:
- Remove the fade-zoom animation when opening it.
- Remove another animation for fading in the menu contents (why do they have two).
- Eagerly load the menu contents; without this the first time has an extra delay.

### A note on themes

If you use a theme like *Modal settings window*, this plugin interferes with
that since it uses `visibility` instead of `opacity` to hide background layers.
I'm undecided on whether to switch to `opacity` for compatibility or stick with
`visibility` because that's the correct way to do it.
