import React from "react";
import { pruneUrlQuery } from "../../utils";
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
		if (this.nextLocation === null) return window.location.pathname;
		else if (this.nextLocation.includes("?")) return this.nextLocation.substr(0, this.nextLocation.indexOf("?"));
		else return this.nextLocation;
	}

	/** The current query of the page URL */
	static get currentQuery (): URLSearchParams {
		if (this.nextLocation === null) return pruneUrlQuery(new URLSearchParams(window.location.search));
		else if (this.nextLocation.includes("?")) return pruneUrlQuery(new URLSearchParams(this.nextLocation.substr(this.nextLocation.indexOf("?"))));
		else return new URLSearchParams();
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
