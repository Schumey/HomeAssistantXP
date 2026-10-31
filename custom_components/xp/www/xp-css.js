/*
 * HomeAssistantXP – lädt xp.css (Mauszeiger, Scrollleisten)
 * Version: 1.5.7
 *
 * Wird von der Integration HomeAssistantXP als Frontend-Skript eingetragen; die
 * Stylesheet-Datei liegt daneben.
 */
const link = document.createElement("link");
link.rel = "stylesheet";
// ?v=<Version> vom eigenen Skript übernehmen, sonst liefert der Browser nach
// einem Update weiter die alte xp.css aus dem Cache
const url = new URL("xp.css", import.meta.url);
url.search = new URL(import.meta.url).search;
link.href = url.href;
document.head.appendChild(link);
