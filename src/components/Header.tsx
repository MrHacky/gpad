import * as React from "react";
import styled from "styled-components";
import { StorageApi } from "../storageApi";

const HeaderDiv = styled.div`
	background: #ddd;
	grid-area: header;
	padding: 8px;
`;

export default function Header(props: { gapi: StorageApi, fake: boolean, toggleFake: () => void }) {
	const { gapi, fake, toggleFake } = props;
	const loggedIn = gapi.state == "in";
	return (
		<HeaderDiv>
			Using: {fake ? 'LocalStorage' : 'Google Drive'}
			<button onClick={toggleFake}>Switch</button>
			{loggedIn ? (
				<button onClick={() => gapi.signout()}>Sign Out</button>
			) : (
				<button onClick={() => gapi.signin()}>Authorize</button>
			)}
		</HeaderDiv>
	);
}
