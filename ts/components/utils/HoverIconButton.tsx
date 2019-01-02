import { Icon, IconButton } from "@material-ui/core";
import React from "react";

/**
 * A Material-UI IconButton which is only displayed when a parent element is hovered over
 * @param layers The number of layers up the DOM tree to use as the parent
 * @param action The callback function to run on click
 * @param children The (pure text) icon to display
 */
export default class HoverIconButton extends React.Component<{ action?: (event) => any, layers?: number, style?: any }> {
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
