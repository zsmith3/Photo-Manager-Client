import { CircularProgress } from "@material-ui/core";
import React from "react";
import GenericPage from "./utils/GenericPage";

/** Page to display while establishing connection to server */
export default class LoadingPage extends React.Component {
	render() {
		return (
			<GenericPage title="Loading">
				<CircularProgress />
			</GenericPage>
		);
	}
}
