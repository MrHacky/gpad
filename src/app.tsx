import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { GoogleApi, useGoogleApi } from "./hooks/GoogleApi";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useFakeApi } from "./hooks/useFakeApi";
import AsyncFileContent from "./components/AsyncFileContent";
import AsyncFileList from "./components/AsyncFileList";

export function App() {
  let gapi: StorageApi = useFakeApi(); //useGoogleApi();
  let [selectedFileId, setSelectedFileId] = useState(null);

  function createFile() {
    gapi.createFile("test.txt", "").then(function(result) {
      alert(JSON.stringify(result));
    });
  }

  return (
    <>
      <div>{gapi.state}</div>
      {gapi.state == "out" ? (
        <button onClick={() => gapi.signin()}>Authorize</button>
      ) : null}
      {gapi.state == "in" ? (
        <button onClick={() => gapi.signout()}>Sign Out</button>
      ) : null}
      <button onClick={() => createFile()}>Create</button>
      {gapi.state == "in" ? (
        <div>
          <AsyncFileList
            gapi={gapi}
            onFileClick={id => setSelectedFileId(id)}
            selectedFileId={selectedFileId}
          />
          <AsyncFileContent
            gapi={gapi}
            selectedFileId={selectedFileId}
            key={selectedFileId}
          />
        </div>
      ) : null}
    </>
  );
}
