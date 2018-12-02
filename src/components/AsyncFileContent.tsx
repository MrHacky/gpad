import * as React from "react";
import { useAsyncState } from "../hooks/useAsyncState";
import { useState } from "react";
import { unstable_batchedUpdates as batch } from "react-dom";
import { StorageApi } from "../storageApi";
import styled from "styled-components";

const FileContent = styled.div`
  padding: 8px;
  width: 500px;
  float: left;
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

  if (remote.error) alert(JSON.stringify(remote.error));
  if (!remote.data) return <FileContent>N/A</FileContent>;

  async function saveFile(): Promise<void> {
    let result = await gapi.saveFile(selectedFileId, localText, base.version);
    console.log("Saved file, result: ", result);
    if (result.success) {
      // INVESTIGATE: swapping these lines seems to be cause weird stuff, while i really think the order here should not matter...
      //              react hooks bug? workaround with batch for now...
      batch(() => {
        remote.doInvalidate();
        setBase({ body: localText, version: result.newVersion });
        console.log("set the baseee");
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

  if (
    !remote.isFetching &&
    !remote.isInvalidated &&
    remote.data.body != base.body
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

  return (
    <FileContent title={"<" + remote.data.body + ">"}>
      version=
      {remote.data.version}
      <br />
      isFetching=
      {remote.isFetching ? "yes" : "no"}
      <br />
      isInvalidated=
      {remote.isInvalidated ? "yes" : "no"}
      <br />
      local-changes=
      {localText != base.body ? "yes" : "no"}
      <br />
      <button onClick={() => saveFile()}>Save</button>
      <textarea
        onChange={e => setLocalText(e.target.value)}
        style={{ width: "100%", height: "300px" }}
        value={localText}
      />
    </FileContent>
  );
}
