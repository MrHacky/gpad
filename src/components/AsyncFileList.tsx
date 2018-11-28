import * as React from "react";
import { useAsyncState } from "../hooks/useAsyncState";

export default function AsyncFileList({ gapi, onFileClick, selectedFileId }) {
  let { data, isFetching, isInvalidated, doInvalidate } = useAsyncState(
    [],
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
      Files:{" "}
      {data.filter(x => x.name.match(/\.txt$/)).map(x => (
        <div key={x.id} onClick={() => onFileClick(x.id)}>
          {x.id == selectedFileId ? ">" : ""}
          {x.name}
        </div>
      ))}
    </span>
  );
}
