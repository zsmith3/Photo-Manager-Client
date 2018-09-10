if ("standardTBButtons" in window) {
	standardTBButtons.push({
		onclick: "openSyncFolder();",
		title: "Create a synchronisation pair from the current folder",
		icon: ["sync"],
		text: "Sync current folder"
	});
}

let script = document.createElement("script");
script.src = "cordova.js";
script.async = false;
document.head.appendChild(script);

//$("<script></script>").attr("src", "js/external/urlsearchparams.js").appendTo("head");
//$("<script></script>").attr("src", "js/sync.js").appendTo("head");
//$("<script></script>").attr("src", "js/save-meta.js").appendTo("head");

if (window.module) module = window.module;
