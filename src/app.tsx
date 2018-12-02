import * as React from "react";
import { useState } from "react";
import { useGoogleApi } from "./hooks/useGoogleApi";
import { useFakeApi } from "./hooks/useFakeApi";
import AsyncFileContent from "./components/AsyncFileContent";
import AsyncFileList from "./components/AsyncFileList";
import { StorageApi } from "./storageApi";
import Header from "./components/Header";

export function App() {
  let gapi: StorageApi = useFakeApi(); //useGoogleApi();
  let [selectedFileId, setSelectedFileId] = useState(null);

  return (
    <>
      <Header gapi={gapi} />
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
