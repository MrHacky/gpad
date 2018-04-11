import * as React from "react";
import { GoogleApi, File } from "./GoogleApi";

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
	filetext: asyncstate<File>;
	localtext: File;
	basetext: File;
}


export class App extends React.Component<{}, State> {
	gapi: GoogleApi;

	constructor(props) {
		super(props);
		this.state = {
			gstate: 'x',
			selectedfile: null,
			files: new asyncstate<any[]>([]),
			// TODO: figure out proper state (machine?) regarding local and remote states and their updates
			filetext: new asyncstate<File>({ body: '', etag: '' }),
			basetext: { body: '', etag: '' },
			localtext: { body: '', etag: '' },
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
						'fields': "nextPageToken, items(id, title)"
					});
					return qr.result.items.map(x => ({...x, name: x.title}));
				}, (files) => this.setState({ files: {...this.state.files, ...files }}));
				if (this.state.selectedfile) {
					await update(this.state.filetext, this.state.selectedfile, async(id) => {
						return await this.gapi.retrieveContent(id);
					}, (filetext) => this.setState({ filetext: {...this.state.filetext, ...filetext }}));
				}
			}
		} catch (e) {
			this.handleError(e);
		}

		let remote = this.state.filetext.data;
		let local = this.state.localtext;
		let base = this.state.basetext;
		if (remote.body != base.body) {
			if (local.body == base.body) {
				// no local changes, update to remote state
				this.setState({
					basetext: remote,
					localtext: remote,
				});
			} else if (local.body == remote.body) {
				// local state agrees with remote, update base
				this.setState({
					basetext: remote,
				});
			} else {
				// conflict detected
			}
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
				<span style={{ width: '500px', float: 'left' }} title={'<' + this.state.filetext.data.body + '>'}>
					etag={this.state.filetext.data.etag}<br/>
					local-changes={(this.state.localtext.body != this.state.basetext.body) ? "yes" : "no"}<br/>
					<button onClick={() => this.saveFile()}>Save</button>
					<textarea onChange={(e) => this.onTextEdit(e)} style={{ width: '100%', height: "300px" }} value={this.state.localtext.body}/>
				</span>
			</div>
		</>;
	}

	onFileClick(id) {
		this.setState({ selectedfile: id });
	}

	onTextEdit(e) {
		this.setState({ localtext: { ...this.state.localtext, body: e.target.value } });
	}

	async saveFile(): Promise<void> {
		let file = this.state.selectedfile;
		let etag = this.state.basetext.etag;
		let text = this.state.localtext.body;
		let save = await this.gapi.saveFile(file, text, etag);
		if (save.success) {
			this.setState({
				filetext: {...this.state.filetext, data: { body: text, etag: save.etag }},
				basetext: { body: text, etag: save.etag },
			});
		} else
			this.handleError("Conflict on save");
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
