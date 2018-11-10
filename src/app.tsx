import * as React from "react";
import { useState, useEffect } from 'react';
import { GoogleApi, GoogleApiFunc, File } from "./GoogleApi";

interface State {
	gstate: string;
	selectedfile: string;
}

function useAsyncState<T, I>(initial: T, id: I, cb: (i: I) => Promise<T>) {
	let [ isFetching, setIsFetching ] = useState(false);
	let [ isInvalidated, setIsInvalidated ] = useState(false);
	let [ currentId, setCurrentId ] = useState(undefined);
	let [ currentData, setCurrentData ] = useState(initial);
	let [ currentError, setCurrentError ] = useState(null);

	if (isFetching) {
		if (id !== currentId) {
			setIsInvalidated(true);
			setCurrentId(id);
		}
	} else if (isInvalidated || id !== currentId) {
		setIsFetching(true);
		setIsInvalidated(false);
		setCurrentId(id);
		cb(id).then(newdata => {
			setCurrentData(newdata);
			setCurrentError(null);
			setIsFetching(false);
		}, error => {
			setCurrentError(error);
			setIsFetching(false);
		});
	}

	return {
		data: currentData,
		error: currentError,
		isFetching,
		isInvalidated,
		doInvalidate: () => setIsInvalidated(true),
	}
}

async function getFileList(gapi): Promise<any[]> {
	let qr = await gapi.gapi.client.drive.files.list({
		'q': "'root' in parents",
		'fields': "nextPageToken, items(id, title)"
	});
	return qr.result.items.map(x => ({...x, name: x.title}));
}

function AsyncFileList({ gapi, onFileClick, selectedFileId }) {
	let { data, isFetching, isInvalidated, doInvalidate } = useAsyncState([], null, () => getFileList(gapi));

	return <span style={{ width: '400px', float: 'left' }}>
		<button onClick={doInvalidate}>Invalidate</button>
		<div>State: {isFetching ? "Fetching " : ""}{isInvalidated ? "Invalidated " : ""}</div>
		Files: {
			data.filter(x => x.name.match(/\.txt$/)).map(x =>
				<div key={x.id} onClick={() => onFileClick(x.id)}>{x.id == selectedFileId ? '>' : ''}{x.name}</div>
			)
		}
	</span>;
}

function AsyncFileContent(props: { gapi: GoogleApi, selectedFileId }) {
	let remote = useAsyncState(null, props.selectedFileId, async (id) => props.selectedFileId ? await props.gapi.retrieveContent(id) : null);
	let [ base, setBase ] = useState({ body: '', etag: '' });
	let [ localText , setLocalText ] = useState("");

	if (remote.error)
		alert(JSON.stringify(remote.error));
	if (!remote.data)
		return <>N/A</>;

	function onTextEdit(e) {
		setLocalText(e.target.value);
	}

	async function saveFile(): Promise<void> {
		let file = props.selectedFileId;
		let etag = base.etag;
		let text = localText;
		let save = await props.gapi.saveFile(file, text, etag);
		if (save.success) {
			// INVESTIGATE: swapping these lines seems to be cause weird stuff, while i really think the order here should not matter...
			//              react hooks bug?
			remote.doInvalidate();
			setBase({ body: text, etag: save.etag });

			/* Possible improvement: Update remote state directly here, as we 'know' what it is on successfull save
			this.setState({
				filetext: {...this.state.filetext, data: { body: text, etag: save.etag }},
				basetext: { body: text, etag: save.etag },
			});
			*/
		} else
			alert("Conflict on save");
	}

	if (!remote.isFetching && !remote.isInvalidated && remote.data.body != base.body) {
		if (localText == base.body) {
			// no local changes, update to remote state
			setBase(remote.data);
			setLocalText(remote.data.body);
		} else if (localText == remote.data.body) {
			// local state agrees with remote, update base
			setBase(remote.data);
		} else {
			// conflict detected
			alert("conflict");
		}
	}

	return <span style={{ width: '500px', float: 'left' }} title={'<' + remote.data.body + '>'}>
		etag={remote.data.etag}<br/>
		isFetching={remote.isFetching ? "yes" : "no"}<br/>
		isInvalidated={remote.isInvalidated ? "yes" : "no"}<br/>
		local-changes={(localText != base.body) ? "yes" : "no"}<br/>
		<button onClick={() => saveFile()}>Save</button>
		<textarea onChange={(e) => onTextEdit(e)} style={{ width: '100%', height: "300px" }} value={localText}/>
	</span>;
}

export class App extends React.Component<{}, State> {
	gapi: GoogleApi;

	constructor(props) {
		super(props);
		this.state = {
			gstate: 'x',
			selectedfile: null,
		};
	}

	handleError(e) {
		alert(JSON.stringify(e));
	}

	handleGapiChange(g) {
		this.gapi = g.api;
		this.onStateChange(g.state);
	}

	render() {
		return <>
			<GoogleApiFunc onChange={(g) => this.handleGapiChange(g)}/>
			<div>{this.state.gstate}</div>
			{this.state.gstate == "out" ? <button onClick={() => this.signin() }>Authorize</button>: null}
			{this.state.gstate == "in"  ? <button onClick={() => this.signout()}>Sign Out</button> : null}
			<button onClick={() => this.createFile()}>Create</button>
			{this.state.gstate == "in" ? <div>
				<AsyncFileList gapi={this.gapi} onFileClick={(id) => this.onFileClick(id)} selectedFileId={this.state.selectedfile}/>
				<AsyncFileContent gapi={this.gapi} selectedFileId={this.state.selectedfile} key={this.state.selectedfile}/>
			</div> : null }
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
		this.gapi.doCreateRequest('test.txt').then(function(result) {
			alert(JSON.stringify(result));
		});
	}

	onStateChange(gstate) {
		this.setState({ gstate });
	}
}
