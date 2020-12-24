import { StorageApi, FileContent, FileListEntry, SaveResult } from "./../storageApi";
import { useState } from "react";
import { useLocalStorage } from "./useLocalStorage";


interface FileInfo {
	body: string;
	version: string;
	name: string;
}

interface FileInfoMap {
	[id: string]: FileInfo;
}

export function useFakeApi(): StorageApi {
	const [state, setState] = useState("in");
	const [getFiles, setFiles] = useLocalStorage("gpad-files", {} as FileInfoMap);
	const [getIdCounter, setIdCounter] = useLocalStorage("gpad-file-id", 1);

	function signin() {
		setState("in");
	}
	function signout() {
		setState("out");
	}
	async function retrieveContent(id: string): Promise<FileContent> {
		let { body, version } = getFiles()[id];
		return { body, version: version.toString() };
	}
	async function saveFile(
		id: string,
		text: string,
		version: string
	): Promise<SaveResult> {
		// This needs to happen 'atomically'! (getFiles+setFiles)
		const files = getFiles();
		const currentFile = files[id];
		if (version == currentFile.version) {
			const newVersion = (parseInt(currentFile.version) + 1).toString();
			const newFile = { ...currentFile, body: text, version: newVersion };
			setFiles({ ...files, [id]: newFile });
			return { success: true, newVersion: newFile.version };
		}
		return { success: false, newVersion: '*' };
	}
	async function getFileList(): Promise<FileListEntry[]> {
		let ret = [];
		const files = getFiles();
		for (let id in files)
			ret.push({ id, name: files[id].name });
		return ret;
	}
	async function createFile(name: string, body: string) {
		// This needs to happen 'atomically'! (getIdCounter+setIdCounter)
		let newId: number = getIdCounter() + 1;
		setIdCounter(newId);

		// This needs to happen 'atomically'! (getFiles+setFiles)
		setFiles({ ...getFiles(), [newId.toString()]: { body, version: "1", name } });
	}
	async function renameFile(id: string, name: string) {
		// TODO
		return { success: false };
	}
	return {
		state,
		signin,
		signout,
		retrieveContent,
		saveFile,
		getFileList,
		createFile,
		renameFile,
	};
}
