import { StorageApi, File } from "./../storageApi";
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
  const [files, updateFiles] = useLocalStorage("gpad-files", {} as FileInfoMap);
  const [id, updateId] = useLocalStorage("gpad-file-id", 1);

  function signin() {
    setState("in");
  }
  function signout() {
    setState("out");
  }
  async function retrieveContent(id: string): Promise<File> {
    let { body, version } = files[id];
    return { body, version: version.toString() };
  }
  async function saveFile(
    id: string,
    text: string,
    version: string
  ): Promise<any> {
    const currentFile = files[id];
    if (version == currentFile.version) {
      const newVersion = (parseInt(currentFile.version) + 1).toString();
      const newFile = { ...currentFile, body: text, version: newVersion };
      updateFiles({ ...files, [id]: newFile });
      return { success: true, version: newFile.version };
    }
    return { success: false, version: null };
  }
  async function getFileList() {
    let ret = [];
    for (let id in files) ret.push({ id, name: files[id].name });
    return ret;
  }
  async function createFile(name: string, body: string) {
    let curid = id + 1;
    updateId(curid);
    updateFiles({ ...files, [curid]: { body, version: "1", name } });
    return {};
  }
  return {
    state,
    signin,
    signout,
    retrieveContent,
    saveFile,
    getFileList,
    createFile
  };
}
