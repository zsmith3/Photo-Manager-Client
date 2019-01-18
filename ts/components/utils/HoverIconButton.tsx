import { Icon, IconButton } from "@material-ui/core";
import React from "react";
import { Input } from "../../controllers/Input";

/**
 * A Material-UI IconButton which is only displayed when a parent element is hovered over
 * (always displayed on touch screens)
 * @param layers The number of layers up the DOM tree to use as the parent
 * @param action The callback function to run on click
 * @param children The (pure text) icon to display
 */
export default class HoverIconButton extends React.Component<{ action?: (event) => any, layers?: number, style?: any }> {
	/** Instances of this component (for external reference) */
	static instances: HoverIconButton[] = []

	/** Reference to the root element */
	mainRef: React.RefObject<HTMLSpanElement>

	state = {
		shouldHide: !Input.isTouching
	}

	constructor (props) {
		super(props);

		this.mainRef = React.createRef();

		HoverIconButton.instances.push(this);
	}

	componentDidMount () {
		if (!this.state.shouldHide) return;

		let layers = this.props.layers || 2;
		let currentElement = this.mainRef.current;
		for (let i = 0; i < layers; i++) currentElement = currentElement.parentElement;
		currentElement.onmouseover = () => Array.from(currentElement.querySelectorAll("span")).filter(el => el.classList.contains("hover-icon-button")).forEach(el => el.style.opacity = "1");
		currentElement.onmouseout = () => Array.from(currentElement.querySelectorAll("span")).filter(el => el.classList.contains("hover-icon-button")).forEach(el => el.style.opacity = "0");
	}

	render () {
		return <span className={ this.state.shouldHide ? "hover-icon-button" : null } ref={ this.mainRef } style={ Object.assign(this.props.style || {}, this.state.shouldHide ? { opacity: 0, transition: "0.3s opacity ease-in-out" } : {}) }>
			<IconButton onClick={ this.props.action }>
				<Icon>{ this.props.children }</Icon>
			</IconButton>
		</span>;
	}
}

let onTouchStart = () => {
	HoverIconButton.instances.forEach(button => button.setState({ shouldHide: false }));
	window.removeEventListener("touchstart", onTouchStart);
};
window.addEventListener("touchstart", onTouchStart);
