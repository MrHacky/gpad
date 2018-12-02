import { StorageApi, FileInfoMap, File } from "./../storageApi";
import { useState } from "react";
import { useLocalStorage } from "./useLocalStorage";

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
    let ret = { success: false, version: null };
    updateFiles(prev => {
      const prevFile = prev[id];
      if (version == prevFile.version) {
        const newVersion = (parseInt(prevFile.version) + 1).toString();
        const newFile = { ...prevFile, body: text, version: newVersion };
        ret.success = true;
        ret.version = newFile.version;
        return { ...prev, [id]: newFile };
      } else return prev;
    });
    return ret;
  }
  async function getFileList() {
    let ret = [];
    for (let id in files) ret.push({ id, name: files[id].name });
    return ret;
  }
  async function createFile(name: string, body: string) {
    let curid: string;
    updateId(prev => {
      curid = "" + prev;
      return ++prev;
    });
    updateFiles(prev => ({ ...prev, [curid]: { body, version: "1", name } }));
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
