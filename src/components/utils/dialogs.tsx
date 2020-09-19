import {
	Button,
	Collapse,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Icon,
	List,
	ListItem,
	ListItemSecondaryAction,
	ListItemText,
	Radio,
	TextField
} from "@material-ui/core";
import React, { Fragment } from "react";
import { HoverIconButton } from ".";
import MountTrackedComponent from "./MountTrackedComponent";

/**
 * A template for a common form of Material-UI dialog
 * @param open A state variable determining whether the dialog is open
 * @param onClose A function which closes the dialog (i.e. by setting "open" to false)
 * @param title The DialogTitle to display
 * @param text The DialogContentText (if any) to display
 * @param actionText The name of the primary DialogAction (the secondary will always be "Cancel")
 * @param action The function to run when the primary DialogAction button is clicked
 * @param noFocus Used by other Dialog types to prevent autofocus of DialogContent
 */
export class SimpleDialog extends MountTrackedComponent<{
	open: boolean;
	onClose: () => void;
	title: string;
	text?: React.ReactNode;
	actionText: string;
	action: () => Promise<any>;
	noFocus?: boolean;
}> {
	state = {
		loading: false
	};

	/** Reference to main dialog content */
	contentRef: React.RefObject<HTMLElement>;

	constructor(props) {
		super(props);

		this.contentRef = React.createRef();
	}

	/** Submit data (on primary DialogAction button click) */
	submit = () => {
		this.setState({ loading: true });
		this.props.action().then(() => {
			this.props.onClose();
			this.setStateSafe({ loading: false });
		});
	};

	componentDidUpdate() {
		if (this.props.open && !this.props.noFocus && !this.state.loading) setTimeout(() => this.contentRef.current.focus(), 1);
	}

	render() {
		return (
			<Dialog open={this.props.open} onClose={this.props.onClose}>
				<DialogTitle>{this.props.title}</DialogTitle>
				<DialogContent onKeyDown={event => event.key === "Enter" && this.submit()} tabIndex={-1} ref={this.contentRef}>
					{Boolean(this.props.text) && <DialogContentText>{this.props.text}</DialogContentText>}
					{this.props.children}
				</DialogContent>
				<DialogActions>
					<Button disabled={this.state.loading} onClick={this.props.onClose} color="primary">
						Cancel
					</Button>
					<Button disabled={this.state.loading} onClick={this.submit} color="primary">
						{this.props.actionText}
					</Button>
				</DialogActions>
			</Dialog>
		);
	}
}

/** Data about a ListDialog item */
interface ListDialogItem {
	id: number;
	name: string;
	noSelect?: boolean;
	children?: ListDialogItem[];
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
 * @param openByDefault Whether collapsible list items are open by default (default = false)
 * @param selectableFilter Filter function applied to each item to determine if it is selectable
 */
export class ListDialog extends React.Component<{
	open: boolean;
	onClose: () => void;
	title: string;
	text?: string;
	actionText: string;
	action: (selected: number) => Promise<any>;
	list: ListDialogItem[];
	selected?: number;
	openByDefault?: boolean;
	selectableFilter?: (id: number) => boolean;
}> {
	state: {
		selected: number;
		itemsOpen: { [id: number]: boolean };
	};

	constructor(props) {
		super(props);

		this.state = { selected: props.selected, itemsOpen: {} };
	}

	/**
	 * Initialise this.state.itemsOpen (to all false)
	 * @param list (Nested) list of items
	 */
	initItemsOpen(list: ListDialogItem[]) {
		let getItemIds: (list: ListDialogItem[]) => number[] = list =>
			list ? list.map(item => item.id).concat(list.map(item => getItemIds(item.children)).reduce((all, cur) => all.concat(cur), [])) : [];
		this.setState({ itemsOpen: getItemIds(list).reduce((acc, cur) => ({ ...acc, [cur]: cur in acc ? acc[cur] : Boolean(this.props.openByDefault) }), this.state.itemsOpen) });
	}

	/**
	 * Collapse/expand a (collapsible) list item
	 * @param itemId ID of list item to toggle
	 */
	toggleItemOpen(itemId: number) {
		this.setState({ itemsOpen: { ...this.state.itemsOpen, [itemId]: !this.state.itemsOpen[itemId] } });
	}

	/**
	 * Recursively generate the displayed list
	 * @param listItems Nested list of items to display
	 * @param indent Current indent level (default = 0)
	 */
	generateList(listItems: ListDialogItem[], indent?: number) {
		let selectable = (itemId: number) => !this.props.selectableFilter || this.props.selectableFilter(itemId) || null;
		indent = indent || 0;
		return (
			<List>
				{listItems.map(item => (
					<Fragment key={item.id}>
						<ListItem
							button={item.noSelect || selectable(item.id)}
							onClick={item.noSelect ? () => this.toggleItemOpen(item.id) : selectable(item.id) && (() => this.setState({ selected: item.id }))}
							style={{ paddingLeft: indent * 16 + "px" }}
						>
							{!item.noSelect && <Radio checked={this.state.selected === item.id} disabled={!selectable(item.id)} />}
							<ListItemText primary={item.name} />
							{item.children &&
								Boolean(item.children.length) &&
								(item.noSelect ? (
									<Icon>{this.state.itemsOpen[item.id] ? "expand_less" : "expand_more"}</Icon>
								) : (
									<ListItemSecondaryAction>
										<HoverIconButton action={() => this.toggleItemOpen(item.id)}>{this.state.itemsOpen[item.id] ? "expand_less" : "expand_more"}</HoverIconButton>
									</ListItemSecondaryAction>
								))}
						</ListItem>
						{item.children && Boolean(item.children.length) && (
							<Collapse in={this.state.itemsOpen[item.id]} unmountOnExit>
								{this.generateList(item.children, indent + 1)}
							</Collapse>
						)}
					</Fragment>
				))}
			</List>
		);
	}

	shouldComponentUpdate(nextProps) {
		// Initialise itemsOpen when list changes
		if (nextProps.list !== this.props.list) {
			this.initItemsOpen(this.props.list);
			return false;
		} else return true;
	}

	render() {
		return (
			<SimpleDialog
				open={this.props.open}
				onClose={this.props.onClose}
				title={this.props.title}
				actionText={this.props.actionText}
				action={() => this.props.action(this.state.selected)}
			>
				{this.generateList(this.props.list)}
			</SimpleDialog>
		);
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
export class TextDialog extends React.Component<{
	open: boolean;
	onClose: () => void;
	title: string;
	actionText: string;
	action: (text: string) => Promise<any>;
	label: string;
	defaultValue?: string;
}> {
	state: {
		value: string;
	};

	constructor(props) {
		super(props);

		this.state = { value: props.defaultValue };
	}

	render() {
		return (
			<SimpleDialog
				open={this.props.open}
				onClose={this.props.onClose}
				title={this.props.title}
				actionText={this.props.actionText}
				action={() => this.props.action(this.state.value)}
				noFocus={true}
			>
				<TextField autoFocus label={this.props.label} defaultValue={this.props.defaultValue} onChange={event => (this.state.value = event.currentTarget.value)} />
			</SimpleDialog>
		);
	}
}
