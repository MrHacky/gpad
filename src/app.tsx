import * as React from "react";
import { useState, useEffect } from "react";
import { useGoogleApi } from "./hooks/useGoogleApi";
import { useFakeApi } from "./hooks/useFakeApi";
import { useDelayedStorageApi } from "./hooks/useDelayedStorageApi";
import AsyncFileContent from "./components/AsyncFileContent";
import AsyncFileList from "./components/AsyncFileList";
import { StorageApi } from "./storageApi";
import Header from "./components/Header";
import styled from "styled-components";
import { useStateAndCookie } from 'persistence-hooks';

const AppWrapper = styled.div`
	display: grid;
	grid-template-areas:
		"header header header"
		"files content content";
	grid-template-rows: 50px 1fr;
	grid-template-columns: 150px 1fr;
	height: 100vh;
`;

const Sidebar = styled.div`
	background: #eee;
	grid-area: files;
	padding: 8px;
`;

function GoogleApiUser(props: { handleGapiChange: Function}) {
	let gapi: StorageApi = useGoogleApi();
	useEffect(() => {
		props.handleGapiChange(gapi);
	}, [gapi.state]);
	return <></>;
}

function FakeApiUser(props: { handleGapiChange: Function}) {
	let gapi: StorageApi = useFakeApi();
	gapi = useDelayedStorageApi(gapi, 500);
	useEffect(() => {
		props.handleGapiChange(gapi);
	}, [gapi.state]);
	return <></>;
}

export function App() {
	let [gapi, setGapi] = useState<StorageApi|null>(null);
	let [fake, setFake] = useStateAndCookie(false, 'gpad-api-selector', { days: 350 });

	let [selectedFileId, setSelectedFileId] = useState<string | null>(null);
	let [isRenaming, setIsRenaming] = useState<boolean>(false);
	let [renameText, setRenameText] = useState<string>('');

	// The actual StorageApi creation is hidden inside the *User components
	// to get around the requirement that hooks cannot be called conditionally
	// Is there a better way?
	let GapiUser = fake ? FakeApiUser : GoogleApiUser;

	function toggleFake() {
		if (!gapi)
			return;
		setGapi(null);
		setFake(() => !fake); // BUG in useStateAndCookie causes setFake(!fake) to not work
		setSelectedFileId(null);
	};

	function onFileClick(id: string, name: string) {
		if (!isRenaming && selectedFileId == id) {
			setIsRenaming(true);
			setRenameText(name);
		} else {
			setIsRenaming(false);
			setSelectedFileId(id);
		}
	}

	async function doRename() {
		if (!gapi || !selectedFileId)
			return;
		let { success } = await gapi.renameFile(selectedFileId, renameText);
		if (success)
			setIsRenaming(false);
	}

	return (
		<AppWrapper>
			<GapiUser handleGapiChange={setGapi}/>
			{gapi ? <Header gapi={gapi} fake={fake} toggleFake={toggleFake}/> : 'Loading...'}
			{gapi && gapi.state == "in" ? (
			<>
				<Sidebar>
					<AsyncFileList
						gapi={gapi}
						onFileClick={onFileClick}
						selectedFileId={selectedFileId}
					/>
					{isRenaming ? <>
						<input type="text" value={renameText} onChange={event => setRenameText(event.target.value)} />
						<button onClick={doRename}>Rename</button>
					</>: null}
				</Sidebar>
				<AsyncFileContent
					gapi={gapi}
					selectedFileId={selectedFileId}
				/>
			</>
			) : null}
		</AppWrapper>
	);
}
