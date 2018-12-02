export interface StorageApi {
  state: string;

  signin(): void;
  signout(): void;
  retrieveContent(id: string): Promise<{ body: string; version: string }>;
  saveFile(
    id: string,
    text: string,
    currentVersion: string
  ): Promise<{ success: boolean; newVersion: string }>;
  getFileList(): Promise<{ id: string; name: string }[]>;
  createFile(name: string, body: string): Promise<any>;
}

export interface File {
  body: string;
  version: string;
}

export interface FileInfo {
  body: string;
  version: string;
  name: string;
}

export interface FileInfoMap {
  [key: string]: FileInfo;
}
