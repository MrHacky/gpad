import * as React from "react";
import { useAsyncState } from "../hooks/useAsyncState";
import { StorageApi, FileListEntry } from "../storageApi";

interface AsyncFileListProps {
	gapi: StorageApi;
	selectedFileId: string | null;
	onFileClick: (id: string, name: string) => void;
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

	const txtFiles: FileListEntry[] = data
		.filter(f => f.name.match(/\.txt$/))
	;
	const selectedFile: FileListEntry | null = txtFiles.filter(({ id }) => id == selectedFileId)[0];

	return (
		<>
			<div>
				<button onClick={() => createFile()}>New file</button>
				<button onClick={doInvalidate}>Invalidate</button>
				{isFetching ? "Fetching " : ""}
				{isInvalidated ? "Invalidated " : ""}
			</div>
			<h4>Files:</h4>
			{txtFiles
				.map(({ id, name }) => (
					<div key={id} title={id} onClick={() => onFileClick(id, name)}>
						{id == selectedFileId ? ">" : ""}
						{name}
					</div>
				))
			}
		</>
	);
}
