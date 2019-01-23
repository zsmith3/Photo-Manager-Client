import { createMuiTheme, CssBaseline, MuiThemeProvider } from "@material-ui/core";
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, HashRouter, Route } from "react-router-dom";
import { Database } from "../controllers/Database";
import "../styles/App.css";
import LoginPage from "./LoginPage";
import MainPage from "./MainPage";
import { LocationManager } from "./utils";
import RegisterPage from "./RegisterPage";


/** Possible root parts for the URL */
export type addressRootTypes = ("folders" | "albums" | "people");


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
				if (this.authCheckInterval) window.clearInterval(this.authCheckInterval);
				this.authCheckInterval = window.setInterval(Database.auth.checkAuth, 60 * 1000);
			}

			this.performRedirect(result);

			ReactDOM.render(<App />, rootElement);
		});
	}

	/**
	 * Rewrite malformatted page URL
	 * @param auth Whether the user is logged in
	 */
	private static performRedirect (auth: boolean) {
		if (LocationManager.currentLocation.length <= 1) {
			LocationManager.updateLocation("/folders/");
		} else if (auth) {
			// TODO make this neater
			if (LocationManager.currentLocation === "/login" || LocationManager.currentLocation === "/register") {
				LocationManager.updateLocation("/folders/");
			}
		}
	}

	constructor (props) {
		super(props);

		App.app = this;
	}

	render () {
		let children = <MuiThemeProvider theme={ App.theme }>
				<CssBaseline />

				<Route path="" render={ (props) => (
					<LocationManager history={ props.history }>
						<Route path="/login" component={ LoginPage } />
						<Route path="/register" component={ RegisterPage } />

						{ ["/folders/", "/people/"].map(path => (
						<Route key={ path } path={ path } render={ () => <MainPage location={ props.location } /> } />
						)) }
					</LocationManager>
				) } />
			</MuiThemeProvider>;

		if (process.env.BUILD_PLATFORM === undefined || process.env.BUILD_PLATFORM === "browser") return <BrowserRouter basename={ process.env.HOST_URL }>{ children }</BrowserRouter>;
		else return <HashRouter>{ children }</HashRouter>;
	}
}
