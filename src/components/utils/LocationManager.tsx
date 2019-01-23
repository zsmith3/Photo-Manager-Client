import React from "react";
import { pruneUrlQuery, getPathnameFromUrl, getQueryFromUrl, trimStr } from "../../utils";
import { History } from "history";

/**
 * A component which can be added to the React component tree to allow for global location updates
 * @param history React Router props.history to be passed via the Route.render method
 */
export default class LocationManager extends React.Component<{ history: History }> {
	/** Singleton instance of LocationManager */
	static instance: LocationManager

	/** The URL to which the page will be redirected when possible */
	private static nextLocation: string = null

	/** The current pathname of the page URL (or the URL which it is about to be redirected to) */
	static get currentLocation (): string {
		if (this.nextLocation === null) {
			if (process.env.BUILD_PLATFORM === undefined || process.env.BUILD_PLATFORM === "browser") {
				return window.location.pathname.substr(trimStr(process.env.HOST_URL, "/", "r").length);
			} else return getPathnameFromUrl(window.location.hash);
		} else return getPathnameFromUrl(this.nextLocation);
	}

	/** The current query of the page URL */
	static get currentQuery (): URLSearchParams {
		if (this.nextLocation === null) {
			if (process.env.BUILD_PLATFORM === undefined || process.env.BUILD_PLATFORM === "browser") return pruneUrlQuery(new URLSearchParams(window.location.search));
			else return getQueryFromUrl(window.location.hash);
		} else return getQueryFromUrl(this.nextLocation);
	}

	/**
	 * Update the location of the page
	 * @param url The new URL to move to
	 */
	static updateLocation (url: string): void {
		if (this.instance) this.instance.props.history.push(url);
		else this.nextLocation = url;
	}

	/**
	 * Update the query string of the page
	 * @param newData Key-value pairs (as object) to add to the query
	 * @param replace Whether to remove the existing query first (default = false)
	 */
	static updateQuery (newData: { [key: string]: string }, replace=false): void {
		let newQuery: URLSearchParams;
		if (replace) newQuery = new URLSearchParams();
		else newQuery = this.currentQuery;

		for (let key in newData) newQuery.set(key, newData[key]);

		let newQueryStr = pruneUrlQuery(newQuery).toString();
		let nextLocation = this.currentLocation + (newQueryStr.length > 0 ? "?" : "") + newQueryStr;

		this.updateLocation(nextLocation);
	}

	constructor (props: { history: History }) {
		super(props);

		LocationManager.instance = this;

		// This will prune query params, and set the location
		LocationManager.updateQuery({});
	}

	render () {
		let Fragment = React.Fragment;

		if (LocationManager.nextLocation === null) {
			return <Fragment>
				{ this.props.children }
			</Fragment>
		} else {
			LocationManager.nextLocation = null;
			return <Fragment />;
		}
	}
}
