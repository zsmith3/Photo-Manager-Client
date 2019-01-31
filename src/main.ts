import React from "react";
import App from "./components/App";

// Hacks
declare global {
	interface Window {
		React: any;
	}
}
window.React = React;

App.start(document.getElementById("app"));
