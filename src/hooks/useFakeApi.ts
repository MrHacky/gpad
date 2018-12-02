import { StorageApi, FileInfoMap, File } from "./../storageApi";
import { useState } from "react";
import { useLocalStorage } from "./useLocalStorage";

export function useFakeApi(): StorageApi {
  const [state, setState] = useState("in");
  const [files, updateFiles] = useLocalStorage("gpad-files", {} as FileInfoMap);
  const [id, updateId] = useLocalStorage("gpad-file-id", 1);

  console.log(files);
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
    let ret = { success: false, version: null };
    const currentFile = files[id];
    if (version == currentFile.version) {
      const newVersion = (parseInt(currentFile.version) + 1).toString();
      const newFile = { ...currentFile, body: text, version: newVersion };
      ret.success = true;
      ret.version = newFile.version;
      console.log("we updated a file:", newFile);
      updateFiles({ ...files, [id]: newFile });
    }
    return ret;
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