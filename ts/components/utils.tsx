import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Icon, IconButton } from "@material-ui/core";
import React from "react";


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
export class HoverIconButton extends React.Component<{ action?: (event) => any, layers?: number }> {
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
		return <span className="hover-icon-button" ref={ this.mainRef } style={ { opacity: 0, transition: "0.3s opacity ease-in-out" } }>
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
export class SimpleDialog extends MountTrackedComponent<{ open: boolean, onClose: () => void, title: string, text?: string, actionText: string, action: () => Promise<any> }> {
	state = {
		loading: false
	}

	render () {
		return <Dialog open={ this.props.open } onClose={ this.props.onClose }>
			<DialogTitle>{ this.props.title }</DialogTitle>
			<DialogContent>
				{ Boolean(this.props.text) &&
					<DialogContentText>this.props.text</DialogContentText>
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
