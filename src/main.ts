import React from "react";
import App from "./components/App";

// Hacks
declare global {
	interface Window {
        React: any,
        __MUI_USE_NEXT_TYPOGRAPHY_VARIANTS__: boolean
	}
}
window.React = React;
window.__MUI_USE_NEXT_TYPOGRAPHY_VARIANTS__ = true;


App.start(document.getElementById("app"));
