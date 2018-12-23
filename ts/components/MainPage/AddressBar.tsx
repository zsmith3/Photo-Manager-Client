import { Icon, IconButton, TextField, Theme, withStyles, Typography } from "@material-ui/core";
import $ from "jquery";
import React from "react";
import { Platform } from "../../controllers/Platform";
import App, { LocationManager, addressRootTypes } from "../App";
import { Folder } from "../../models";

/** Address bar element */
class AddressBar extends React.Component<{ rootType: addressRootTypes, rootId: number, classes: { addressBar: string, address: string, search: string } }> {
	static styles = (theme: Theme) => ({
		addressBar: {
			backgroundColor: theme.palette.background.paper
		},
		address: {
			display: "inline"
		},
		search: {
			float: "right" as "right"
		}
	});


	/**
	 * Determine whether two versions of `this.props` are the same
	 * @param props1 The first version
	 * @param props2 The second version
	 * @returns Whether or not they are equal
	 */
	private static compareProps(props1: { rootType: addressRootTypes, rootId: number }, props2: { rootType: addressRootTypes, rootId: number }): boolean {
		return props1.rootType === props2.rootType && props1.rootId === props2.rootId;
	}


	state = {
		address: "/"
	}


	constructor (props) {
		super(props);

		this.fetchAddress(props);
	}


	/**
	 * Get the address to display, based on `this.props`
	 * @param props The value of `this.props` to use
	 * @returns Promise representing the address
	 */
	private async getAddress (props: { rootType: addressRootTypes, rootId: number }): Promise<string> {
		if (props.rootId === null) return "/";

		switch (props.rootType) {
			case "folders":
				const folder = await Folder.loadObject<Folder>(props.rootId);
				return folder.path;
		}
	}

	/**
	 * Load the display address into `this.state`
	 * (calls `this.setState`)
	 * @param props The value of `this.props` to use
	 */
	private fetchAddress (props: { rootType: addressRootTypes, rootId: number }) {
		this.getAddress(props).then(address => {
			if (AddressBar.compareProps(props, this.props)) {
				this.setState({ address: address });
			}
		});
	}

	/** Move up to the parent folder (or other container) */
	private moveUp = () => {
		if (this.props.rootId === null) return;

		switch (this.props.rootType) {
			case "folders":
				let folder = Folder.getById(this.props.rootId);
				LocationManager.updateLocation("/folders/" + (folder.parentID ? `${ folder.parentID }/` : ""));
		}
	}


	shouldComponentUpdate(nextProps) {
		if (AddressBar.compareProps(this.props, nextProps)) {
			// If props are unchanged, then state must have changed, so re-render
			return true;
		} else {
			// If props have changed, fetch the new address, which will update the state
			this.fetchAddress(nextProps);
			return false;
		}
	}

	render () {
		return <div className={this.props.classes.addressBar}>
			<span>
				<IconButton title="Back" onClick={ () => LocationManager.instance.props.history.goBack() }>
					<Icon>arrow_back</Icon>
				</IconButton>

				<IconButton title="Forward" onClick={ () => LocationManager.instance.props.history.goForward() }>
					<Icon>arrow_forward</Icon>
				</IconButton>

				<IconButton title="Up" onClick={ this.moveUp }>
					<Icon>arrow_upward</Icon>
				</IconButton>

				<IconButton title="Return to root folders" onClick={ () => LocationManager.updateLocation("/folders/") }>
					<Icon>home</Icon>
				</IconButton>
			</span>

			{/* <span> */}
				<Typography className={ this.props.classes.address }>{ this.state.address }</Typography>
			{/* </span> */}

			{/* <span className={ this.props.classes.search } id="search" onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {if (event.key == 'Enter') App.app.refreshFilesData(null, null, {"search": $(event.currentTarget).find('#searchinput').val().toString() })}}>
				<TextField id="searchinput" label="Search" title="Search the current view for files" onSubmit={() => App.app.refreshFilesData(null, null, {"search": $(event.currentTarget).val().toString() })} />
			</span> */}
		</div>;
		//<MDCText id="searchinput" placeholder="Search" data-icon-after="search" data-icon-before="arrow_back" title="Search the current view for files" onsubmit="App.app.refreshFilesData(null, null, {'search': $(this).val()});"></MDCText>
	}
}

export default withStyles(AddressBar.styles)(AddressBar);
