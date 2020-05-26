import { withWidth } from "@material-ui/core";
import React from "react";
import { MountTrackedComponent } from "../../utils";
import { AlbumView, FolderView, PersonView, ScanView } from "./views";
import View, { ViewProps } from "./views/View";

/** Container to select and display the appropriate View class for the current URL */
class ViewContainer extends MountTrackedComponent<ViewProps> {
	/** Get the current View class (based on rootType) */
	getViewClass(): typeof View {
		return {
			folders: FolderView,
			albums: AlbumView,
			people: PersonView,
			scans: ScanView
		}[this.props.rootType];
	}

	render() {
		const ViewClass = this.getViewClass();

		return <ViewClass {...this.props} width={this.props.width} />;
	}
}

export default withWidth()(ViewContainer);
