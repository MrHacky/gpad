import * as React from "react";
import { useState, useEffect } from 'react';
import { GoogleApi, useGoogleApi, File } from "./GoogleApi";

import { unstable_batchedUpdates as batch }  from "react-dom";

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
			batch(() => {
				setCurrentData(newdata);
				setCurrentError(null);
				setIsFetching(false);
			});
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

function AsyncFileList({ gapi, onFileClick, selectedFileId }) {
	let { data, isFetching, isInvalidated, doInvalidate } = useAsyncState([], null, () => gapi.getFileList());

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
			//              react hooks bug? workaround with batch for now...
			batch(() => {
				remote.doInvalidate();
				setBase({ body: text, etag: save.etag });
			});

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

export function App() {
	let gapi = useGoogleApi();
	let [ selectedFileId, setSelectedFileId ] = useState(null);

	function createFile() {
		gapi.doCreateRequest('test.txt').then(function(result) {
			alert(JSON.stringify(result));
		});
	}

	return <>
		<div>{gapi.state}</div>
		{gapi.state == "out" ? <button onClick={() => gapi.signin() }>Authorize</button>: null}
		{gapi.state == "in"  ? <button onClick={() => gapi.signout()}>Sign Out</button> : null}
		<button onClick={() => createFile()}>Create</button>
		{gapi.state == "in" ? <div>
			<AsyncFileList gapi={gapi} onFileClick={(id) => setSelectedFileId(id)} selectedFileId={selectedFileId}/>
			<AsyncFileContent gapi={gapi} selectedFileId={selectedFileId} key={selectedFileId}/>
		</div> : null }
	</>;
};
