import { createMuiTheme, CssBaseline, MuiThemeProvider } from "@material-ui/core";
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Route } from "react-router-dom";
import { Database } from "../controllers/Database";
import "../styles/App.css";
import LoginPage from "./LoginPage";
import MainPage from "./MainPage";
import { LocationManager } from "./utils";


/** Possible root parts for the URL */
export type addressRootTypes = ("folders" | "albums" | "people");


// Hack to fix a bug
declare global {
	interface Window {
		React: any
	}
}
window.React = React;


/** Main application class, to handle all views */
export default class App extends React.Component {
	/** Singleton instance of App class */
	static app: App;

	/** Interval ID to check authorisation (and log out if needed) */
	static authCheckInterval: number

	/** MUI theme override */
	static theme = createMuiTheme({
		overrides: {
			MuiIconButton: {
				root: {
					padding: 6
				}
			}
		}
	});

	/**
	 * Start the application in a given root element
	 * @param rootElement Root HTML element to host the application
	 */
	static start (rootElement: HTMLElement): void {
		Database.auth.checkAuth().then(result => {
			if (result) {
				// App.app.init();

				if (this.authCheckInterval) window.clearInterval(this.authCheckInterval);
				this.authCheckInterval = window.setInterval(Database.auth.checkAuth, 60 * 1000);
			}

			this.performRedirect();

			ReactDOM.render(<App />, rootElement);
		});
	}

	/** Rewrite malformatted page URL  */
	private static performRedirect () {
		if (LocationManager.currentLocation.length <= 1) {
			LocationManager.updateLocation("/folders/");
		}
	}

	constructor (props) {
		super(props);

		App.app = this;

		// Notification snackbar
		//this.snackbar = new mdc.snackbar.MDCSnackbar($("#snackbar").get(0));
	}

	render () {
		return <BrowserRouter>
			<MuiThemeProvider theme={ App.theme }>
				<CssBaseline />

				<Route path="" render={ (props) => (
					<LocationManager history={ props.history }>
						<Route path="/login" component={ LoginPage } />

						{ ["/folders/", "/people/"].map(path => (
						<Route key={ path } path={ path } render={ () => <MainPage location={ props.location } /> } />
						)) }
					</LocationManager>
				) } />
			</MuiThemeProvider>
		</BrowserRouter>;
	}
}
