import * as React from "react";
import { useAsyncState } from "../hooks/useAsyncState";
import { useState } from "react";
import { unstable_batchedUpdates as batch } from "react-dom";
import { StorageApi } from "../storageApi";

export default function AsyncFileContent(props: {
  gapi: StorageApi;
  selectedFileId;
}) {
  let remote = useAsyncState(
    null,
    props.selectedFileId,
    async id =>
      props.selectedFileId ? await props.gapi.retrieveContent(id) : null
  );
  let [base, setBase] = useState({ body: "", etag: "" });
  let [localText, setLocalText] = useState("");

  if (remote.error) alert(JSON.stringify(remote.error));
  if (!remote.data) return <>N/A</>;

  async function saveFile(): Promise<void> {
    let file = props.selectedFileId;
    let etag = base.etag;
    let text = localText;
    let result = await props.gapi.saveFile(file, text, etag);
    console.log(result);
    if (result.success) {
      // INVESTIGATE: swapping these lines seems to be cause weird stuff, while i really think the order here should not matter...
      //              react hooks bug? workaround with batch for now...
      batch(() => {
        remote.doInvalidate();
        setBase({ body: text, etag: result.etag });
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
    <span
      style={{ width: "500px", float: "left" }}
      title={"<" + remote.data.body + ">"}
    >
      etag=
      {remote.data.etag}
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
    </span>
  );
}
