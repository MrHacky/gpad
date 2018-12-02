import * as React from "react";
import styled from "styled-components";
import { StorageApi } from "../storageApi";

const HeaderDiv = styled.div`
  background: #ddd;
  padding: 8px;
`;

export default function Header(props: { gapi: StorageApi }) {
  const { gapi } = props;
  const loggedIn = gapi.state == "in";
  return (
    <HeaderDiv>
      {loggedIn ? (
        <button onClick={() => gapi.signout()}>Sign Out</button>
      ) : (
        <button onClick={() => gapi.signin()}>Authorize</button>
      )}
    </HeaderDiv>
  );
}
