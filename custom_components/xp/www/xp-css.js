/*
 * HomeAssistantXP – lädt xp.css (Mauszeiger, Scrollleisten)
 * Version: 1.5.0
 *
 * Wird von der Integration HomeAssistantXP als Frontend-Skript eingetragen; die
 * Stylesheet-Datei liegt daneben.
 */
const link = document.createElement("link");
link.rel = "stylesheet";
link.href = new URL("xp.css", import.meta.url).href;
document.head.appendChild(link);
