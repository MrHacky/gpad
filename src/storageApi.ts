export interface StorageApi {
	state: string;

	signin(): void;
	signout(): void;
	retrieveContent(id: string): Promise<FileContent>;
	saveFile(
		id: string,
		text: string,
		currentVersion: string
	): Promise<SaveResult>;
	getFileList(): Promise<FileListEntry[]>;
	createFile(name: string, body: string): Promise<void>;
	renameFile(id: string, name: string): Promise<{ success: boolean }>;
}

export interface FileListEntry {
	id: string;
	name: string;
}

export interface FileContent {
	body: string;
	version: string;
}

export interface SaveResult {
	success: boolean;
	newVersion: string;
}
