import { Button, Checkbox, FormControlLabel, TextField, Typography } from "@material-ui/core";
import React from "react";
import { Link } from "react-router-dom";
import { Database } from "../controllers/Database";
import GenericPage from "./utils/GenericPage";

/** Separate page for logging in */
export default class LoginPage extends React.Component<{ history: any }> {
	state = {
		username: "",
		password: "",
		remain_in: true,
		error: { username: [], password: [], non_field_errors: [] }
	};

	/** Attempt to log in with current input data */
	handleSubmit(event: Event) {
		Database.auth
			.logIn(this.state.username, this.state.password, this.state.remain_in)
			.then(() => {
				this.props.history.push("/folders/");
			})
			.catch(error => {
				this.setState({
					error: {
						username: error.username || [],
						password: error.password || [],
						non_field_errors: error.non_field_errors || []
					}
				});
			});

		event.preventDefault();
	}

	render() {
		return (
			<GenericPage title="Login" introText="Please log in to access private files.">
				<br />

				<form onSubmit={this.handleSubmit.bind(this)}>
					<TextField
						label="Username"
						error={this.state.error.username.length > 0}
						title="Please enter your username"
						onChange={event => this.setState({ username: event.target.value })}
						helperText={this.state.error.username}
					/>

					<br />
					<br />

					<TextField
						label="Password"
						error={this.state.error.password.length > 0}
						type="password"
						title="Please enter your password"
						onChange={event => this.setState({ password: event.target.value })}
						helperText={this.state.error.password}
					/>

					<br />
					<br />

					<FormControlLabel control={<Checkbox checked={this.state.remain_in} onChange={event => this.setState({ remain_in: event.target.checked })} />} label="Remain logged in" />

					<br />
					<br />
					<br />

					<Button variant="contained" color="primary" type="submit">
						Log in
					</Button>
				</form>

				<br />

				<Typography component="p">{this.state.error.non_field_errors}</Typography>

				<br />

				<Typography>
					<Link to="/register">Create Account</Link>
				</Typography>
			</GenericPage>
		);
	}
}
