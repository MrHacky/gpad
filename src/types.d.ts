interface StorageApi {
  state: string;

  signin(): void;
  signout(): void;
  retrieveContent(id: string): Promise<{ body: string; etag: string }>;
  saveFile(
    id: string,
    text: string,
    etag: string
  ): Promise<{ success: boolean; etag: string }>;
  getFileList(): Promise<{ id: string; name: string }[]>;
  createFile(name: string, body: string): Promise<any>;
}

interface RemoteFile {
  body: string;
  etag: string;
}

interface FileInfo {
  body: string;
  version: number;
  name: string;
}

interface FileInfoMap {
  [key: string]: FileInfo;
}
