import * as React from "react";
import { useAsyncState } from "../hooks/useAsyncState";
import { useState } from "react";
import { unstable_batchedUpdates as batch } from "react-dom";
import { StorageApi } from "../storageApi";
import styled from "styled-components";

const FileContent = styled.div`
  grid-area: content;
`;

const NoFileSelected = styled.div`
  display: flex;
  align-items: center;
  text-align: center;
  width: 100%;
`;

const BeautifulTextArea = styled.textarea`
  background: #111;
  color: white;
  width: 100%;
  height: 100%;
  border: none;
  overflow: auto;
  outline: none;
  resize: none;
`;

const FileInfoHeader = styled.div`
  background: #222;
  color: #ddd;
  padding: 4px;
`;

const InfoHeaderSpan = styled.span`
  padding: 0px 4px;
`;
const GreenSpan = styled(InfoHeaderSpan)`
  color: green;
`;
const RedInfoHeaderSpan = styled(InfoHeaderSpan)`
  color: red;
`;

export default function AsyncFileContent(props: {
  gapi: StorageApi;
  selectedFileId;
}) {
  const { selectedFileId, gapi } = props;
  let remote = useAsyncState(null, selectedFileId, async id =>
    selectedFileId ? await gapi.retrieveContent(id) : null
  );
  let [base, setBase] = useState({ body: "", version: "" });
  let [localText, setLocalText] = useState("");

  const hasRemoteData = remote.data;
  if (remote.error) alert(JSON.stringify(remote.error));

  async function saveFile(): Promise<void> {
    let result = await gapi.saveFile(selectedFileId, localText, base.version);
    if (result.success) {
      // INVESTIGATE: swapping these lines seems to be cause weird stuff, while i really think the order here should not matter...
      //              react hooks bug? workaround with batch for now...
      batch(() => {
        remote.doInvalidate();
        setBase({ body: localText, version: result.newVersion });
      });

      /* Possible improvement: Update remote state directly here, as we 'know' what it is on successfull save
              this.setState({
                  filetext: {...this.state.filetext, data: { body: text, etag: save.etag }},
                  basetext: { body: text, etag: save.etag },
              });
              */
    } else {
      console.error("Conflict on save");
    }
  }

  function handleKeyPress(e) {
    if ((e.ctrlKey || e.metaKey) && e.key == "s") {
      saveFile();
      e.preventDefault();
    }
  }

  // this checked 'remote.data.body != base.body' before instead of version.
  // Not sure if this is how we should update, but I think so
  if (
    hasRemoteData &&
    !remote.isFetching &&
    !remote.isInvalidated &&
    remote.data.version != base.version
  ) {
    if (localText == base.body) {
      // no local changes, update to remote state
      setBase(remote.data);
      setLocalText(remote.data.body);
    } else if (localText == remote.data.body) {
      // local state agrees with remote, update base
      setBase(remote.data);
    } else {
      // conflict detected
      alert("conflict");
    }
  }
  const hasLocalChanges = localText != base.body;

  return (
    <FileContent>
      {hasRemoteData ? (
        <>
          <FileInfoHeader>
            <button onClick={() => saveFile()}>Save</button>
            <InfoHeaderSpan>version: {remote.data.version}</InfoHeaderSpan>
            {remote.isFetching ? (
              <InfoHeaderSpan>Fetching data...</InfoHeaderSpan>
            ) : null}
            {remote.isInvalidated ? (
              <RedInfoHeaderSpan>Invalidated data!</RedInfoHeaderSpan>
            ) : null}
            {hasLocalChanges ? (
              <GreenSpan>Has unsaved local changes</GreenSpan>
            ) : null}
          </FileInfoHeader>
          <BeautifulTextArea
            onKeyDown={e => handleKeyPress(e)}
            onChange={e => setLocalText(e.target.value)}
            value={localText}
          />
        </>
      ) : (
        <NoFileSelected>N/A</NoFileSelected>
      )}
    </FileContent>
  );
}
