import * as React from "react";
import { useAsyncState } from "../hooks/useAsyncState";
import { StorageApi, FileListEntry } from "../storageApi";

import styled from "styled-components";

const Sidebar = styled.div`
	background: #eee;
	grid-area: files;
	padding: 8px;
`;

interface AsyncFileListProps {
	gapi: StorageApi;
	selectedFileId: string | null;
	onFileClick: (id: string) => void;
};

export default function AsyncFileList({ gapi, onFileClick, selectedFileId }: AsyncFileListProps) {
	let { data, isFetching, isInvalidated, doInvalidate } = useAsyncState(
		[],
		null,
		() => gapi.getFileList()
	);

	async function createFile() {
		const result = await gapi.createFile("test.txt", "");
		await doInvalidate();
	}

	return (
		<Sidebar>
			<div>
				<button onClick={() => createFile()}>New file</button>
				<button onClick={doInvalidate}>Invalidate</button>
				{isFetching ? "Fetching " : ""}
				{isInvalidated ? "Invalidated " : ""}
			</div>
			<h4>Files:</h4>
			{data
				.filter(f => f.name.match(/\.txt$/))
				.map(({ id, name }) => (
					<div key={id} onClick={() => onFileClick(id)}>
						{id == selectedFileId ? ">" : ""}
						{name} ({id})
					</div>
				))}
		</Sidebar>
	);
}
