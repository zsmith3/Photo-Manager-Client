import React from "react";
import GenericPage from "./utils/GenericPage";

/** Page to display when server connection fails */
export default class ErrorPage extends React.Component {
	render() {
		return (
			<GenericPage title="Error" introText={`There was an error connecting to the server (${process.env.SERVER_URL}). Try refreshing the page or contacting an administrator.`} />
		);
	}
}
