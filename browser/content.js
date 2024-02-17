if (typeof browser === "undefined") {
    var browser = chrome;
}

const script = document.createElement("script");
script.src = browser.runtime.getURL("dist/Vencord.js");
script.id = "vencord-script";
Object.assign(script.dataset, {
    extensionBaseUrl: browser.runtime.getURL(""),
    version: browser.runtime.getManifest().version
});

const style = document.createElement("link");
style.type = "text/css";
style.rel = "stylesheet";
style.href = browser.runtime.getURL("dist/Vencord.css");

document.documentElement.append(script);

document.addEventListener(
    "DOMContentLoaded",
    () => document.documentElement.append(style),
    { once: true }
);
