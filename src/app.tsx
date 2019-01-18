import * as React from "react";
import { useState } from "react";
import { useGoogleApi } from "./hooks/useGoogleApi";
import { useFakeApi } from "./hooks/useFakeApi";
import { useDelayedStorageApi } from "./hooks/useDelayedStorageApi";
import AsyncFileContent from "./components/AsyncFileContent";
import AsyncFileList from "./components/AsyncFileList";
import { StorageApi } from "./storageApi";
import Header from "./components/Header";
import styled from "styled-components";

import * as wrap from "./wrap";
//declare wrap: number;

const AppWrapper = styled.div`
	display: grid;
	grid-template-areas:
		"header header header"
		"files content content";
	grid-template-rows: 50px 1fr;
	grid-template-columns: 150px 1fr;
	height: 100vh;
`;


export function App() {
	//let gapi: StorageApi = useGoogleApi();
	let gapi: StorageApi = useFakeApi();

	gapi = useDelayedStorageApi(gapi, 500);

	let [selectedFileId, setSelectedFileId] = useState<string | null>(null);

	async function doWrap() {
		let i = await import("./test");
		
		i.testIt(1);
		i.default(2);
		let c = new i.MyClass();
		c.num;
	}

	return (
		<AppWrapper>
			<button onClick={doWrap}>Wrap</button>
			<Header gapi={gapi} />
			{gapi.state == "in" ? (
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
