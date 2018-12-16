export interface StorageApi {
	state: string;

	signin(): void;
	signout(): void;
	retrieveContent(id: string): Promise<File>;
	saveFile(
		id: string,
		text: string,
		currentVersion: string
	): Promise<SaveResult>;
	getFileList(): Promise<{ id: string; name: string }[]>;
	createFile(name: string, body: string): Promise<any>;
}

export interface File {
	body: string;
	version: string;
}

export interface SaveResult {
	success: boolean;
	newVersion: string;
}
