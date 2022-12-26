import { Grid, Hidden, Icon, IconButton, InputAdornment, TextField, Theme, Typography, withStyles, withWidth, Zoom } from "@material-ui/core";
import { Breakpoint } from "@material-ui/core/styles/createBreakpoints";
import { isWidthUp } from "@material-ui/core/withWidth";
import React from "react";
import { Album, Folder, Person, ScanFolder } from "../../models";
import { UpdateHandler } from "../../utils";
import { addressRootTypes } from "../App";
import { LocationManager } from "../utils";
import { navDrawerWidth } from "./NavDrawer";

/** Props for AddressBar */
interface AddressBarProps {
	rootType: addressRootTypes;
	rootId: number;
	classes: {
		addressBar: string;
		address: string;
		search: string;
		searchIcon: string;
		searchShowIcon: string;
	};
	width: Breakpoint;
}

/** State for AddressBar */
interface AddressBarState {
	address: string;
	searchValue: string;
	searchShown: boolean;
}

/** Address bar component */
class AddressBar extends React.Component<AddressBarProps, AddressBarState> {
	/** Total height of the AddressBar */
	static height = 36;

	static styles = (theme: Theme) => ({
		addressBar: {
			backgroundColor: theme.palette.background.paper,
			height: AddressBar.height
		},
		address: {
			display: "inline-block",
			lineHeight: "36px",
			overflow: "hidden" as "hidden",
			whiteSpace: "nowrap" as "nowrap",
			textOverflow: "ellipsis" as "ellipsis",
			margin: "0 10px",
			direction: "rtl" as "rtl",
			[theme.breakpoints.down("sm")]: {
				maxWidth: "calc(100vw - 200px)"
			},
			[theme.breakpoints.up("md")]: {
				maxWidth: "calc(100vw - " + (navDrawerWidth + 378) + "px)"
			}
		},
		placeholder: {
			flexGrow: 1
		},
		searchShowIcon: {
			float: "right" as "right"
		},
		searchZoom: {
			transformOrigin: "100% 50% 0"
		},
		search: {
			float: "right" as "right",
			[theme.breakpoints.down("sm")]: {
				position: "absolute" as "absolute",
				backgroundColor: "white",
				width: "100%",
				left: 0,
				padding: "0 10px"
			}
		},
		searchIcon: {
			cursor: "pointer" as "pointer"
		}
	});

	state: AddressBarState = {
		address: "/",
		searchValue: "",
		searchShown: false
	};

	/** Handler to update the displayed address on model change */
	addressUpdateHandler: UpdateHandler = null;

	/**
	 * Determine whether two versions of `this.props` are the same
	 * @param props1 The first version
	 * @param props2 The second version
	 * @returns Whether or not they are equal
	 */
	private static compareProps(props1: AddressBarProps, props2: AddressBarProps): boolean {
		return props1.rootType === props2.rootType && props1.rootId === props2.rootId;
	}

	/** Update the display address (if props still match) */
	private updateAddress(props: AddressBarProps, address: string) {
		if (AddressBar.compareProps(props, this.props)) {
			this.setState({ address: address });
		}
	}

	/**
	 * Load the display address into `this.state`, based on `this.props`
	 * (and update on model change)
	 * @param props The value of `this.props` to use
	 */
	private async fetchAddress(props: AddressBarProps): Promise<void> {
		if (this.addressUpdateHandler !== null) {
			this.addressUpdateHandler.unregister();
			this.addressUpdateHandler = null;
		}

		if (props.rootId === null) {
			setTimeout(() => this.updateAddress(props, "/"), 0);
			return;
		}

		switch (props.rootType) {
			case "folders":
				(await Folder.loadObject<Folder>(props.rootId)).updateHandlers.register(folder => this.updateAddress(props, folder.path));
				break;
			case "people":
				(await Person.loadObject<Person>(props.rootId)).updateHandlers.register(person => this.updateAddress(props, person.full_name));
				break;
			case "albums":
				(await Album.loadObject<Album>(props.rootId)).updateHandlers.register(album => this.updateAddress(props, album.path));
				break;
			case "scans":
				(await ScanFolder.loadObject<ScanFolder>(props.rootId)).updateHandlers.register(scanFolder => this.updateAddress(props, scanFolder.path));
				break;
		}
	}

	/** Move up to the parent folder (or other container) */
	private moveUp = () => {
		if (this.props.rootId === null) return;

		switch (this.props.rootType) {
			case "folders":
			case "scans":
				let folder = (this.props.rootType === "folders" ? Folder : ScanFolder).getById(this.props.rootId);
				LocationManager.updateLocation(`/${this.props.rootType}/` + (folder.parentID ? `${folder.parentID}/` : ""), ["page"]);
				break;
		}
	};

	/** Update the URL to search for the current search input value */
	private search() {
		LocationManager.updateQuery({ search: this.state.searchValue });
	}

	shouldComponentUpdate(nextProps: AddressBarProps) {
		if (AddressBar.compareProps(this.props, nextProps)) {
			// If props are unchanged, then state must have changed, so re-render
			return true;
		} else {
			// If props have changed, fetch the new address, which will update the state
			this.fetchAddress(nextProps);
			return false;
		}
	}

	componentDidMount() {
		this.fetchAddress(this.props);
	}

	componentWillUnmount() {
		if (this.addressUpdateHandler !== null) {
			this.addressUpdateHandler.unregister();
			this.addressUpdateHandler = null;
		}
	}

	render() {
		let searchShown = isWidthUp("md", this.props.width) ? true : this.state.searchShown;

		return (
			<div className={this.props.classes.addressBar}>
				{/* Grid is needed to avoid positioning of elements affecting each other */}
				<Grid container>
					{/* Navigation buttons */}
					<Grid item>
						<IconButton title="Back" onClick={() => LocationManager.instance.props.history.goBack()}>
							<Icon>arrow_back</Icon>
						</IconButton>

						<IconButton title="Forward" onClick={() => LocationManager.instance.props.history.goForward()}>
							<Icon>arrow_forward</Icon>
						</IconButton>

						<IconButton title="Up" onClick={this.moveUp} disabled={!["folders", "scans"].includes(this.props.rootType)}>
							<Icon>arrow_upward</Icon>
						</IconButton>

						<IconButton title="Return to root folders" onClick={() => LocationManager.updateLocation("/folders/", ["page", "search"])}>
							<Icon>home</Icon>
						</IconButton>
					</Grid>

					{/* Page address (i.e. folder path) */}
					<Grid item>
						<Typography className={this.props.classes.address}>{this.state.address}</Typography>
					</Grid>

					{/* Placeholder to push following to right */}
					<div style={{ flexGrow: 1 }} />

					<Grid item>
						{/* Button to show/hide search bar on mobile */}
						<Hidden mdUp>
							<IconButton className={this.props.classes.searchShowIcon} onClick={() => this.setState({ searchShown: true })}>
								<Icon>search</Icon>
							</IconButton>
						</Hidden>

						{/* Search bar (with zoom effect for mobile) */}
						<Zoom in={searchShown}>
							<TextField
								className={this.props.classes.search}
								placeholder="Search"
								title="Search the current view for files"
								defaultValue={LocationManager.currentQuery.get("search")}
								onKeyDown={event => {
									if (event.key === "Enter") this.search();
								}}
								onChange={event => (this.state.searchValue = event.currentTarget.value)}
								InputProps={{
									startAdornment: (
										<Hidden mdUp>
											<InputAdornment className={this.props.classes.searchIcon} position="start" onClick={() => this.setState({ searchShown: false })}>
												<Icon>arrow_back</Icon>
											</InputAdornment>
										</Hidden>
									),
									endAdornment: (
										<InputAdornment className={this.props.classes.searchIcon} position="end" onClick={() => this.search()}>
											<Icon>search</Icon>
										</InputAdornment>
									)
								}}
							/>
						</Zoom>
					</Grid>
				</Grid>
			</div>
		);
	}
}

export default withWidth()(withStyles(AddressBar.styles)(AddressBar));

/** Height occupied by the AddressBar component */
export const addressBarHeight = AddressBar.height;
