import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Icon, IconButton, List, ListItem, Radio, ListItemText, TextField, Menu, MenuItem } from "@material-ui/core";
import React, { Fragment } from "react";
import { FileImgSizes, FaceImgSizes } from "../controllers/Platform";
import Hammer from "react-hammerjs";
import { History } from "history";
import { pruneUrlQuery } from "../utils";


/**
 * A component which can be added to the React component tree to allow for global location updates
 * @param history React Router props.history to be passed via the Route.render method
 */
export class LocationManager extends React.Component<{ history: History }> {
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


/**
 * A React Component extension which tracks when it has been mounted
 * @template P The PropTypes for this component
 */
export class MountTrackedComponent<P> extends React.Component<P> {
	/** Whether the component has mounted yet (and so whether setState can be called) */
	mounted = false

	componentDidMount () { this.mounted = true; }

	componentWillUnmount () { this.mounted = false; }

	/**
	 * Set the state of the component regardless of whether it has been mounted yet
	 * @param state The state object to set to
	 */
	setStateSafe (state: {}) {
		if (this.mounted) this.setState(state);
		else if (this.state) Object.assign(this.state, state);
		else this.state = state;
	}
}


/**
 * A Material-UI IconButton which is only displayed when a parent element is hovered over
 * @param layers The number of layers up the DOM tree to use as the parent
 * @param action The callback function to run on click
 * @param children The (pure text) icon to display
 */
export class HoverIconButton extends React.Component<{ action?: (event) => any, layers?: number, style?: any }> {
	mainRef: React.RefObject<HTMLSpanElement>

	constructor (props) {
		super(props);

		this.mainRef = React.createRef();
	}

	componentDidMount () {
		let layers = this.props.layers || 2;
		let currentElement = this.mainRef.current;
		for (let i = 0; i < layers; i++) currentElement = currentElement.parentElement;
		currentElement.onmouseover = () => Array.from(currentElement.querySelectorAll("span")).filter(el => el.classList.contains("hover-icon-button")).forEach(el => el.style.opacity = "1");
		currentElement.onmouseout = () => Array.from(currentElement.querySelectorAll("span")).filter(el => el.classList.contains("hover-icon-button")).forEach(el => el.style.opacity = "0");
	}

	render () {
		return <span className="hover-icon-button" ref={ this.mainRef } style={ Object.assign(this.props.style || {}, { opacity: 0, transition: "0.3s opacity ease-in-out" }) }>
			<IconButton onClick={ this.props.action }>
				<Icon>{ this.props.children }</Icon>
			</IconButton>
		</span>;
	}
}


/**
 * A template for a common form of Material-UI dialog
 * @param open A state variable determining whether the dialog is open
 * @param onClose A function which closes the dialog (i.e. by setting "open" to false)
 * @param title The DialogTitle to display
 * @param text The DialogContentText (if any) to display
 * @param actionText The name of the primary DialogAction (the secondary will always be "Cancel")
 * @param action The function to run when the primary DialogAction button is clicked
 */
export class SimpleDialog extends MountTrackedComponent<{ open: boolean, onClose: () => void, title: string, text?: React.ReactNode, actionText: string, action: () => Promise<any> }> {
	state = {
		loading: false
	}

	render () {
		return <Dialog open={ this.props.open } onClose={ this.props.onClose }>
			<DialogTitle>{ this.props.title }</DialogTitle>
			<DialogContent>
				{ Boolean(this.props.text) &&
					<DialogContentText>{ this.props.text }</DialogContentText>
				}
				{ this.props.children }
			</DialogContent>
			<DialogActions>
				<Button disabled={ this.state.loading } onClick={ this.props.onClose } color="primary">Cancel</Button>
				<Button disabled={ this.state.loading } onClick={ () => { this.setState({ loading: true }); this.props.action().then(() => { this.props.onClose(); this.setStateSafe({ loading: false }); }); } } color="primary">{ this.props.actionText }</Button>
			</DialogActions>
		</Dialog>
	}
}


/**
 * Simple Material-UI dialog with List selection
 * (most props are passed to base SimpleDialog)
 * @param open A state variable determining whether the dialog is open
 * @param onClose A function which closes the dialog (i.e. by setting "open" to false)
 * @param title The DialogTitle to display
 * @param text The DialogContentText (if any) to display
 * @param actionText The name of the primary DialogAction (the secondary will always be "Cancel")
 * @param action The function to run when the primary DialogAction button is clicked
 * @param list List of items to display and select from
 * @param selected ID of initially selected item
 * @param nullItem Default item with an ID of `null`
 */
export class ListDialog extends React.Component<{ open: boolean, onClose: () => void, title: string, text?: string, actionText: string, action: (selected: number) => Promise<any>, list: { id: number, name: string }[], selected?: number, nullItem?: string }> {
	state: {
		selected: number
	}

	constructor (props) {
		super(props);

		this.state = { selected: props.selected };
	}

	render () {
		return <SimpleDialog
				open={ this.props.open } onClose={ this.props.onClose }
				title={ this.props.title } actionText={ this.props.actionText }
				action={ () => this.props.action(this.state.selected) }
				>
				<List>
					{ this.props.nullItem &&
					<ListItem key={-1} button onClick={ () => this.setState({ selected: null }) }>
						<Radio checked={ this.state.selected === null } />
						<ListItemText primary={ this.props.nullItem } />
					</ListItem>
					}
					{ this.props.list.map(item => (
						<ListItem key={ item.id } button onClick={ () => this.setState({ selected: item.id }) }>
							<Radio checked={ this.state.selected === item.id } />
							<ListItemText primary={ item.name } />
						</ListItem>
					))}
				</List>
			</SimpleDialog>;
	}
}


/**
 * Simple Material-UI dialog with a TextField
 * @param open A state variable determining whether the dialog is open
 * @param onClose A function which closes the dialog (i.e. by setting "open" to false)
 * @param title The DialogTitle to display
 * @param actionText The name of the primary DialogAction (the secondary will always be "Cancel")
 * @param action The function to run when the primary DialogAction button is clicked
 * @param label The label of the TextField component
 * @param defaultValue Initial value of the TextField component
 */
export class TextDialog extends React.Component<{ open: boolean, onClose: () => void, title: string, actionText: string, action: (text: string) => Promise<any>, label: string, defaultValue?: string }> {
	state: {
		value: string
	}

	constructor (props) {
		super(props);

		this.state = { value: props.defaultValue };
	}

	render () {
		return <SimpleDialog
				open={ this.props.open } onClose={ this.props.onClose }
				title={ this.props.title } actionText={ this.props.actionText }
				action={ () => this.props.action(this.state.value) }
				>
				<TextField autoFocus label={ this.props.label } defaultValue={ this.props.defaultValue } onChange={ (event) => this.state.value = event.currentTarget.value } />
			</SimpleDialog>;
	}
}


type ImgSizes = (FileImgSizes | FaceImgSizes);

interface ImageLoaderPropsType {
	model: {
		loadImgData (size: ImgSizes): Promise<string>,
		getBestImgSize (size: ImgSizes): ImgSizes
	},
	maxSize: ImgSizes,
	onFirstLoad? (): void,
	className?: string,
	style?: React.CSSProperties
}

/**
 * Image component which loads different sizes one-by-one
 * @param model The File/Face model for which to load image data
 * @param maxSize The largest image size to load
 * @param className Class(es) to pass to the <img /> element
 * @param style CSS styling to pass to the <img /> element
 */
export class ImageLoader extends MountTrackedComponent<ImageLoaderPropsType> {
	state = {
		loadState: null as ImgSizes,
		imageData: null as string
	}

	/**
	 * Attempt to load image data for a size
	 * @param size Size of image to load
	 */
	loadImg (size: ImgSizes): void {
		this.props.model.loadImgData(size).then(data => {
			if (this.props.onFirstLoad && this.state.loadState === null) this.props.onFirstLoad();

			this.setStateSafe({ imageData: data, loadState: size });
			this.loadNext();
		}).catch(error => {
			this.setStateSafe({ loadState: size });
			this.loadNext();
		});
	}

	/** Load the next image size (or stop when maxSize is reached) */
	loadNext () {
		if (this.state.loadState !== null && this.state.loadState >= this.props.maxSize) return;

		let nextState = this.state.loadState === null ? 0 : this.state.loadState + 1;

		this.loadImg(nextState);
	}

	/** Load the initial image (using the best existing size) */
	loadFirst (props: ImageLoaderPropsType): void {
		let startState = props.model.getBestImgSize(props.maxSize);
		if (startState === null) this.loadNext();
		else this.loadImg(startState);
	}

	constructor (props: ImageLoaderPropsType) {
		super(props);

		this.loadFirst(props);
	}

	shouldComponentUpdate(nextProps: ImageLoaderPropsType) {
		if (nextProps === this.props) return true;
		else {
			if (nextProps.model !== this.props.model) this.state.loadState = null;

			this.loadFirst(nextProps);

			return false;
		}
	}

	render () {
		// <Hammer> element seems to make external <Hammer> placed
		// around <ImageLoader /> actually work (not sure why)
		return <Hammer>
				<img src={ this.state.imageData } className={ this.props.className } style={ this.props.style } />
			</Hammer>;
	}
}
