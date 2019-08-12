import React from "react";
import { UpdateHandler } from "../../utils";

/**
 * A React Component extension which tracks when it has been mounted
 * @template P The PropTypes for this component
 */
export default class MountTrackedComponent<P, S = {}> extends React.Component<P, S> {
	/** Whether the component has mounted yet (and so whether setState can be called) */
	mounted = false;

	updateHandler: UpdateHandler = null;

	componentDidMount() {
		this.mounted = true;
	}

	componentWillUnmount() {
		this.mounted = false;
		if (this.updateHandler !== null) this.updateHandler.unregister();
	}

	/**
	 * Set the state of the component regardless of whether it has been mounted yet
	 * @param state The state object to set to
	 */
	setStateSafe(state: S) {
		if (this.mounted) this.setState(state);
		else if (this.state) Object.assign(this.state, state);
		else this.state = state;
	}
}
