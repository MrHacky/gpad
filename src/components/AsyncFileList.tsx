import * as React from "react";
import { useAsyncState } from "../hooks/useAsyncState";

export default function AsyncFileList({ gapi, onFileClick, selectedFileId }) {
  let { data, isFetching, isInvalidated, doInvalidate } = useAsyncState(
    [] as { id: string; name: string }[],
    null,
    () => gapi.getFileList()
  );

  return (
    <span style={{ width: "400px", float: "left" }}>
      <button onClick={doInvalidate}>Invalidate</button>
      <div>
        State: {isFetching ? "Fetching " : ""}
        {isInvalidated ? "Invalidated " : ""}
      </div>
      <h4>Files:</h4>
      {data.filter(f => f.name.match(/\.txt$/)).map(({ id, name }) => (
        <div key={id} onClick={() => onFileClick(id)}>
          {id == selectedFileId ? ">" : ""}
          {name} ({id})
        </div>
      ))}
    </span>
  );
}
