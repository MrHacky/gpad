import * as React from "react";
import { useAsyncState } from "../hooks/useAsyncState";
import { useState, useEffect } from "react";
import { unstable_batchedUpdates as batch } from "react-dom";
import { StorageApi, FileContent } from "../storageApi";
import styled from "styled-components";

const FileContent = styled.div`
	grid-area: content;
`;

const NoFileSelected = styled.div`
	display: flex;
	align-items: center;
	text-align: center;
	width: 100%;
`;

const BeautifulTextArea = styled.textarea`
	background: #111;
	color: white;
	width: 100%;
	height: 100%;
	border: none;
	overflow: auto;
	outline: none;
	resize: none;
`;

const FileInfoHeader = styled.div`
	background: #222;
	color: #ddd;
	padding: 4px;
`;

const InfoHeaderSpan = styled.span`
	padding: 0px 4px;
`;
const GreenSpan = styled(InfoHeaderSpan)`
	color: green;
`;
const RedInfoHeaderSpan = styled(InfoHeaderSpan)`
	color: red;
`;
const SmallInfoHeaderSpan = styled(InfoHeaderSpan)`
	color: #666;
	font-size: .75em;
`;

const DummyFile: FileContent = { body: '', version: '' };

export default function AsyncFileContent(props: {
	gapi: StorageApi;
	selectedFileId: string | null;
}) {
	const { selectedFileId, gapi } = props;
	let remote = useAsyncState(DummyFile, selectedFileId, async id =>
		id ? await gapi.retrieveContent(id) : DummyFile
	);
	let [base, setBase] = useState({ body: "", version: "" });
	let [localText, setLocalText] = useState("");

	let [isSaving, setIsSaving] = useState(false);
	let [autosave, setAutoSave] = useState(true);

	const hasRemoteData = remote.data.version != '';
	if (remote.error) alert(JSON.stringify(remote.error));

	async function saveFile(): Promise<void> {
		if (selectedFileId == null)
			return;
		if (isSaving)
			return;
		setIsSaving(true);
		let result = await gapi.saveFile(selectedFileId, localText, base.version);
		if (result.success) {
			// INVESTIGATE: swapping these lines seems to be cause weird stuff, while i really think the order here should not matter...
			//              react hooks bug? workaround with batch for now...
			batch(() => {
				remote.doInvalidate();
				setIsSaving(false);
				setBase({ body: localText, version: result.newVersion });
			});

			/* Possible improvement: Update remote state directly here, as we 'know' what it is on successfull save
			this.setState({
				filetext: {...this.state.filetext, data: { body: text, etag: save.etag }},
				basetext: { body: text, etag: save.etag },
			});
			*/
		} else {
			setIsSaving(false);
			console.error("Conflict on save");
		}
	}

	function handleKeyPress(e: React.KeyboardEvent<HTMLTextAreaElement>) {
		if ((e.ctrlKey || e.metaKey) && e.key == "s") {
			saveFile();
			e.preventDefault();
		}
	}

	// this checked 'remote.data.body != base.body' before instead of version.
	// Not sure if this is how we should update, but I think so
	if (
		hasRemoteData &&
		!remote.isFetching &&
		!remote.isInvalidated &&
		!isSaving &&
		remote.data.version != base.version
	) {
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
	const hasLocalChanges = localText != base.body;

	useEffect(() => {
		const handle = window.setInterval(() => {
			if (autosave && selectedFileId != null && hasLocalChanges)
				saveFile();
		}, 5000);
		return () => window.clearInterval(handle);
	}, [autosave, selectedFileId, hasLocalChanges, saveFile]);

	useEffect(() => {
		const cb = () => {
			remote.doInvalidate();
		};
		window.addEventListener('focus', cb);
		return () => window.removeEventListener('focus', cb);
	}, [ remote.doInvalidate ]);

	return (
		<FileContent>
			{hasRemoteData ? (
				<>
					<FileInfoHeader>
						<button onClick={() => remote.doInvalidate()}>Refresh</button>
						<button onClick={() => saveFile()}>Save</button>
						<label><input type="checkbox" checked={autosave} onChange={(e) => setAutoSave(e.target.checked)}/>autosave</label>
						<SmallInfoHeaderSpan>version: {remote.data.version}</SmallInfoHeaderSpan>
						{isSaving ? (
							<InfoHeaderSpan>Saving...</InfoHeaderSpan>
						) : null}
						{remote.isFetching ? (
							<InfoHeaderSpan>Fetching...</InfoHeaderSpan>
						) : null}
						{remote.isInvalidated ? (
							<InfoHeaderSpan>Invalidated</InfoHeaderSpan>
						) : null}
						{hasLocalChanges ? (
							<GreenSpan>Has unsaved local changes</GreenSpan>
						) : null}
					</FileInfoHeader>
					<BeautifulTextArea
						onKeyDown={e => handleKeyPress(e)}
						onChange={e => setLocalText(e.target.value)}
						value={localText}
					/>
				</>
			) : (
				<NoFileSelected>N/A</NoFileSelected>
			)}
		</FileContent>
	);
}
