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

	return (
		<AppWrapper>
			<GapiUser handleGapiChange={setGapi}/>
			{gapi ? <Header gapi={gapi} fake={fake} toggleFake={toggleFake}/> : 'Loading...'}
			{gapi && gapi.state == "in" ? (
			<>
				<AsyncFileList
					gapi={gapi}
					onFileClick={(id: string) => setSelectedFileId(id)}
					selectedFileId={selectedFileId}
				/>
				<AsyncFileContent
					gapi={gapi}
					selectedFileId={selectedFileId}
				/>
			</>
			) : null}
		</AppWrapper>
	);
}
