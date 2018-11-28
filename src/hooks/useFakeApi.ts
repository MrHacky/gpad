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
  async function retrieveContent(id: string): Promise<RemoteFile> {
    let { body, version } = files[id];
    return { body, etag: "" + version };
  }
  async function saveFile(id, text, etag): Promise<any> {
    let ret = { success: false, etag: null };
    updateFiles(prev => {
      const fi = prev[id];
      if (etag == fi.version) {
        const nfi = { ...fi, body: text, version: fi.version + 1 };
        ret.success = true;
        ret.etag = "" + nfi.version;
        return { ...prev, [id]: nfi };
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
    updateFiles(prev => ({ ...prev, [curid]: { body, version: 1, name } }));
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
