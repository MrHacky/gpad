import * as React from "react";
import { useAsyncState } from "../hooks/useAsyncState";
import styled from "styled-components";

const Sidebar = styled.div`
  background: #eee;
  width: 400px;
  float: left;
  padding: 8px;
`;

export default function AsyncFileList({ gapi, onFileClick, selectedFileId }) {
  let { data, isFetching, isInvalidated, doInvalidate } = useAsyncState(
    [] as { id: string; name: string }[],
    null,
    () => gapi.getFileList()
  );

  function createFile() {
    gapi.createFile("test.txt", "").then(function(result) {
      alert(JSON.stringify(result));
    });
  }

  return (
    <Sidebar>
      <div>
        <button onClick={() => createFile()}>New file</button>
        <button onClick={doInvalidate}>Invalidate</button>
        {isFetching ? "Fetching " : ""}
        {isInvalidated ? "Invalidated " : ""}
      </div>
      <h4>Files:</h4>
      {data
        .filter(f => f.name.match(/\.txt$/))
        .map(({ id, name }) => (
          <div key={id} onClick={() => onFileClick(id)}>
            {id == selectedFileId ? ">" : ""}
            {name} ({id})
          </div>
        ))}
    </Sidebar>
  );
}
