import { History } from "history";
import React from "react";
import { getPathnameFromUrl, getQueryFromUrl, pruneUrlQuery, trimStr } from "../../utils";

/**
 * A component which can be added to the React component tree to allow for global location updates
 * @param history React Router props.history to be passed via the Route.render method
 */
export default class LocationManager extends React.Component<{
	history: History;
}> {
	/** Singleton instance of LocationManager */
	static instance: LocationManager;

	/** The URL to which the page will be redirected when possible */
	private static nextLocation: string = null;

	/** The current pathname of the page URL (or the URL which it is about to be redirected to) */
	static get currentLocation(): string {
		if (this.nextLocation === null) {
			if (process.env.BUILD_PLATFORM === undefined || process.env.BUILD_PLATFORM === "browser") {
				return window.location.pathname.substr(trimStr(process.env.HOST_URL, "/", "r").length);
			} else return getPathnameFromUrl(window.location.hash);
		} else return getPathnameFromUrl(this.nextLocation);
	}

	/** The current query of the page URL */
	static get currentQuery(): URLSearchParams {
		if (this.nextLocation === null) {
			if (process.env.BUILD_PLATFORM === undefined || process.env.BUILD_PLATFORM === "browser") return pruneUrlQuery(new URLSearchParams(window.location.search));
			else return getQueryFromUrl(window.location.hash);
		} else return getQueryFromUrl(this.nextLocation);
	}

	/**
	 * Get the new location of the page (without updating the page)
	 * @param url The new URL to move to
	 * @param replaceQuery Whether to fully or partially replace the existing query
	 * @returns The new location
	 */
	static getUpdatedLocation(url: string, replaceQuery: boolean | string[] = true): string {
		let newQuery = new URLSearchParams();
		if (replaceQuery !== true) {
			newQuery = this.currentQuery;
			if (replaceQuery !== false) {
				for (let param of replaceQuery) newQuery.delete(param);
			}
		}
		let newQString = newQuery.toString();
		url = newQString ? url + "?" + newQString : url;

		return url;
	}

	/**
	 * Update the location of the page
	 * @param url The new URL to move to
	 * @param replaceQuery Whether to fully or partially replace the existing query
	 */
	static updateLocation(url: string, replaceQuery: boolean | string[] = true): void {
		url = this.getUpdatedLocation(url, replaceQuery);

		if (this.instance) this.instance.props.history.push(url);
		else this.nextLocation = url;
	}

	/**
	 * Update the query string (without applying updates)
	 * @param newData Key-value pairs (as object) to add to the query
	 * @param replace Whether to remove the existing query first (default = false)
	 * @returns The new page location based on updates
	 */
	static getUpdatedQueryLocation(newData: { [key: string]: string }, replace = false): string {
		let newQuery: URLSearchParams;
		if (replace) newQuery = new URLSearchParams();
		else newQuery = this.currentQuery;

		for (let key in newData) newQuery.set(key, newData[key]);

		let newQueryStr = pruneUrlQuery(newQuery).toString();
		let nextLocation = this.currentLocation + (newQueryStr.length > 0 ? "?" : "") + newQueryStr;

		return nextLocation;
	}

	/**
	 * Update the query string of the page
	 * @param newData Key-value pairs (as object) to add to the query
	 * @param replace Whether to remove the existing query first (default = false)
	 */
	static updateQuery(newData: { [key: string]: string }, replace = false): void {
		let nextLocation = this.getUpdatedQueryLocation(newData, replace);
		this.updateLocation(nextLocation);
	}

	constructor(props: { history: History }) {
		super(props);

		LocationManager.instance = this;

		// This will prune query params, and set the location
		LocationManager.updateQuery({});
	}

	render() {
		let Fragment = React.Fragment;

		if (LocationManager.nextLocation === null) {
			return <Fragment>{this.props.children}</Fragment>;
		} else {
			LocationManager.nextLocation = null;
			return <Fragment />;
		}
	}
}
