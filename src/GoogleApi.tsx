import { useState, useEffect } from 'react';
import * as React from "react";

// Client ID and API key from the Developer Console
var CLIENT_ID = '236851809100-miu80r5sj3hjbrfv9gic09pj8udrthpg.apps.googleusercontent.com';
var API_KEY = 'AIzaSyAkB2oP1tvUHfmVZKIKe_iju12iU_R1Scw';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v2/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.file';

interface Props {
	onChange: Function;
};

export interface File {
	body: string;
	etag: string;
}

export function useGoogleApi() {
	const [g, setG] = useState({ state: 'init' } as any);

	function updateSigninStatus(isSignedIn) {
		setG({...g, state: isSignedIn ? 'in' : 'out' });
	};

	useEffect(() => {
		if (g.state == 'init') {
			setG({ state: 'waiting-1' });
			let script = document.createElement('script');
			script.async = true;
			script.defer = true;
			script.src = "https://apis.google.com/js/api.js";
			script.onload = () => setG({ state: 'loading', script: script });
			document.head.appendChild(script);
		}
		if (g.state == 'loading') {
			setG({ state: 'waiting-2' });
			g.script.onload = function () { };
			g.script.parentNode.removeChild(g.script);
			let w = window as any;
			let ngapi = new GoogleApi(w.gapi);
			//w.gapi = undefined;
			ngapi.gapi.load('client:auth2', () => setG({ state: 'authenticating', api: ngapi }));
		}
		if (g.state == 'authenticating') {
			let gapi = g.api.gapi;
			setG({ state: 'waiting-3', api: g.api });
			gapi.client.init({
				apiKey: API_KEY,
				clientId: CLIENT_ID,
				discoveryDocs: DISCOVERY_DOCS,
				scope: SCOPES
			}).then(() => {
				// Listen for sign-in state changes.
				gapi.auth2.getAuthInstance().isSignedIn.listen((s) => updateSigninStatus(s));

				// Handle the initial sign-in state.
				updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
			});
		}
	}, [ g ]);

	return g;
}

export function GoogleApiFunc(props: { onChange: any }) {
	let g = useGoogleApi();
	useEffect(() => props.onChange(g), [g]);
	return <div/>;
}

export class GoogleApi {
	gapi: any;

	constructor(gapi: any) {
		this.gapi = gapi;
	}

	makePromise<T>(request): Promise<T> {
		return new Promise<T>((resolve) => {
			request.execute(resolve);
		});
	}

	signin() {
		//this.props.onChange('loading');
		this.gapi.auth2.getAuthInstance().signIn();
	}

	signout() {
		//this.props.onChange('loading');
		this.gapi.auth2.getAuthInstance().signOut();
	}

	// TODO: properly detect case where the file already exists, probably in a function using this one
	doCreateRequest(fileName) {
		const boundary = '-------314159265358979323846X' + (100000 + Math.floor(Math.random() * 100000));
		const delimiter = "\r\n--" + boundary + "\r\n";
		const close_delim = "\r\n--" + boundary + "--";

		var contentType = 'application/octet-stream';
		var metadata = {
			'title': fileName,
			'mimeType': contentType
		};

		var base64Data = btoa("");
		var multipartRequestBody =
			delimiter +
			'Content-Type: application/json\r\n\r\n' +
			JSON.stringify(metadata) +
			delimiter +
			'Content-Type: ' + contentType + '\r\n' +
			'Content-Transfer-Encoding: base64\r\n' +
			'\r\n' +
			base64Data +
			close_delim;

		var request = this.gapi.client.request({
			'path': '/upload/drive/v2/files',
			'method': 'POST',
			'params': {'uploadType': 'multipart'},
			'headers': {
				'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
			},
			'body': multipartRequestBody,
		});
		return this.makePromise<any>(request);
	}

	doSaveRequest(fileId, fileData, etag) {
		var request = this.gapi.client.request({
			'path': '/upload/drive/v2/files/' + fileId,
			'method': 'PUT',
			'params': {'uploadType': 'media', alt: 'json', fields: 'etag' },
			'headers': {
				'Content-Type': 'application/octet-stream',
				'If-Match': etag,
			},
			'body': fileData,
		});
		return this.makePromise<any>(request);
	}

	async retrieveContent(fileId): Promise<File> {
		// alt=media request use different etag values than metadata requests, and uploads need the metadata etag value
		// so we first do a metadata request to get the etag, and also the headRevisionId which should uniquely identify the content
		// then we use the headRevisionId to retreive the actual content, and ignore the etag header in this request
		let metadata = await this.gapi.client.drive.files.get({
			'fileId': fileId,
			'fields': 'etag,headRevisionId',
		});
		let content = await this.gapi.client.drive.files.get({
			'fileId': fileId,
			'revisionId': metadata.result.headRevisionId,
			'alt': 'media',
		});
		return {
			body: content.body,
			etag: metadata.result.etag,
		};
	}

	async saveFile(id, text, etag): Promise<any> {
		let response = await this.doSaveRequest(id, text, etag);
		if (response.error) {
			if (response.error.code != 412)
				throw response.error;
			return {
				success: false,
			};
		}
		return {
			success: true,
			etag: response.etag,
		};
	}
}
