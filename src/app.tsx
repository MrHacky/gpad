import * as React from "react";
import { GoogleApi } from "./GoogleApi";

class asyncstate<T> {
	constructor(public data: T) {};
	isFetching: boolean = false;
	didInvalidate: boolean = true;
	lastError: any = null;
	id: any = null;
}

async function update<T,I>(t: asyncstate<T>, newid: I, cb: (i: I) => Promise<T>, setState): Promise<void> {
	if (t.isFetching) {
		if (newid != t.id)
			setState({ didInvalidate: true, id: newid });
		return;
	}
	if (!t.didInvalidate && newid == t.id)
		return;
	setState({ isFetching: true, didInvalidate: false, id: newid });
	let data = await cb(newid);
	setState({ isFetching: false, data });
}

interface State {
	gstate: string;
	files: asyncstate<any[]>;
	selectedfile: string;
	filetext: asyncstate<string>;
}


export class App extends React.Component<{}, State> {
	gapi: GoogleApi;

	constructor(props) {
		super(props);
		this.state = {
			gstate: 'x',
			selectedfile: null,
			files: new asyncstate<any[]>([]),
			filetext: new asyncstate<string>(""),
		};
	}

	componentDidMount() {
		this.gapi = new GoogleApi({
			onChange: (state) => this.onStateChange(state),
		});
	}

	componentDidUpdate() {
		this.checkUpdates();
	}

	async checkUpdates(): Promise<void> {
		try {
			if (this.state.gstate == "in") {
				await update(this.state.files, null, async (): Promise<any[]> => {
					let qr = await this.gapi.gapi.client.drive.files.list({
						'q': "'root' in parents",
						'fields': "nextPageToken, files(id, name)"
					});
					return qr.result.files;
				}, (files) => this.setState({ files: {...this.state.files, ...files }}));
				if (this.state.selectedfile) {
					await update(this.state.filetext, this.state.selectedfile, async(id) => {
						let qr = await this.gapi.gapi.client.drive.files.get({
							'fileId': id,
							'alt': 'media',
						});
						return JSON.stringify(qr);
					}, (filetext) => this.setState({ filetext: {...this.state.filetext, ...filetext }}));
				}
			}
		} catch (e) {
			this.handleError(e);
		}
	}

	handleError(e) {
		alert(JSON.stringify(e));
	}

	render() {
		return <>
			{this.state.gstate == "out" ? <button onClick={() => this.signin() }>Authorize</button>: null}
			{this.state.gstate == "in"  ? <button onClick={() => this.signout()}>Sign Out</button> : null}
			<button onClick={() => this.createFile()}>Create</button>
			<button onClick={() => this.setState({ files: { ...this.state.files, didInvalidate: true }})}>Invalidate</button>
			<div>State: {this.state.files.isFetching ? "Fetching " : ""}{this.state.files.didInvalidate ? "Invalidated " : ""}</div>
			<div>
				<span style={{ width: '400px', float: 'left' }}>
					Files: {
						this.state.files.data.filter(x => x.name.match(/\.txt$/)).map(x =>
							<div key={x.id} onClick={() => this.onFileClick(x.id)}>{x.id == this.state.selectedfile ? '>' : ''}{x.name}</div>
						)
					}
				</span>
				<span style={{ width: '300px', float: 'left' }}>{this.state.filetext.data}</span>
			</div>
		</>;
	}

	onFileClick(id) {
		this.setState({ selectedfile: id });
	}

	signin() {
		this.gapi.signin();
	}

	signout() {
		this.gapi.signout();
	}

	createFile() {
		this.gapi.insertFile('test.txt', function(result) {
			alert(JSON.stringify(result));
		});
	}

	onStateChange(gstate) {
		this.setState({ gstate });
	}
}
