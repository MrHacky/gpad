import { useState, useEffect } from "react";
import { StorageApi, FileListEntry, FileContent, SaveResult } from "../storageApi";

// Client ID and API key from the Developer Console
var CLIENT_ID =
	"236851809100-miu80r5sj3hjbrfv9gic09pj8udrthpg.apps.googleusercontent.com";
var API_KEY = "AIzaSyAkB2oP1tvUHfmVZKIKe_iju12iU_R1Scw";

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = [
	"https://www.googleapis.com/discovery/v1/apis/drive/v2/rest"
];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES =
	"https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.file";

interface Props {
	onChange: Function;
}

export interface GoogleStorageApi extends StorageApi {
	createFolder(name: string): Promise<string>;
	queryFileList(query: string): Promise<FileListEntry[]>;
}

export function useGoogleApi(): GoogleStorageApi {
	const [o, setO] = useState(() => new GoogleApi(null));
	const [state, setState] = useState("init");

	useEffect(() => {
		o.initialize(setState);
	}, []);

	return {
		state,
		signin         : o.signin         .bind(o),
		signout        : o.signout        .bind(o),
		retrieveContent: o.retrieveContent.bind(o),
		saveFile       : o.saveFile       .bind(o),
		getFileList    : o.getFileList    .bind(o),
		createFile     : o.createFile     .bind(o),
		createFolder   : o.createFolder   .bind(o),
		renameFile     : o.renameFile     .bind(o),
		queryFileList  : o.queryFileList  .bind(o),
	};
}

export class GoogleApi {
	gapi: any;

	constructor(gapi: any) {
		this.gapi = gapi;
	}

	async initialize(setState: (state: string) => void): Promise<void> {
		setState("fetching");
		if (!(window as any).gapi) {
			let script = document.createElement("script");
			await new Promise<void>(resolve => {
				script.async = true;
				script.defer = true;
				script.src = "https://apis.google.com/js/api.js";
				script.onload = () => resolve();
				document.head.appendChild(script);
			});
			setState("loading");
			script.onload = function() {};
			if (script.parentNode)
				script.parentNode.removeChild(script);
			let w = window as any;
			this.gapi = w.gapi;
		} else
			this.gapi = (window as any).gapi;
		await new Promise<void>(resolve => this.gapi.load("client:auth2", resolve));
		setState("authenticating");
		await this.gapi.client.init({
			apiKey: API_KEY,
			clientId: CLIENT_ID,
			discoveryDocs: DISCOVERY_DOCS,
			scope: SCOPES
		});

		function updateSigninStatus(isSignedIn: boolean) {
			setState(isSignedIn ? "in" : "out");
		}

		// Subscribe to state changes
		this.gapi.auth2
			.getAuthInstance()
			.isSignedIn.listen((s: boolean) => updateSigninStatus(s));

		// Handle the initial sign-in state.
		updateSigninStatus(this.gapi.auth2.getAuthInstance().isSignedIn.get());
	}

	makePromise<T>(request: any): Promise<T> {
		return new Promise<T>(resolve => {
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

	async createFolder(name: string): Promise<string> {
		const fileMetadata = {
			'title': name,
			'mimeType': 'application/vnd.google-apps.folder',
		};
		let request = await this.gapi.client.drive.files.insert({
			resource: fileMetadata,
			fields: 'id',
		});
		if (request.status == 200)
			return request.result.id;
		else
			throw new Error(request);
	}

	// TODO: properly detect case where the file already exists, probably in a function using this one
	createFile(fileName: string, body: string) {
		const boundary =
			"-------314159265358979323846X" +
			(100000 + Math.floor(Math.random() * 100000));
		const delimiter = "\r\n--" + boundary + "\r\n";
		const close_delim = "\r\n--" + boundary + "--";

		var contentType = "application/octet-stream";
		var metadata = {
			title: fileName,
			mimeType: contentType
		};

		var base64Data = btoa(body);
		var multipartRequestBody =
			delimiter +
			"Content-Type: application/json\r\n\r\n" +
			JSON.stringify(metadata) +
			delimiter +
			"Content-Type: " +
			contentType +
			"\r\n" +
			"Content-Transfer-Encoding: base64\r\n" +
			"\r\n" +
			base64Data +
			close_delim;

		var request = this.gapi.client.request({
			path: "/upload/drive/v2/files",
			method: "POST",
			params: { uploadType: "multipart" },
			headers: {
				"Content-Type": 'multipart/mixed; boundary="' + boundary + '"'
			},
			body: multipartRequestBody
		});
		return this.makePromise<any>(request);
	}

	doSaveRequest(fileId: string, fileData: string, etag: string) {
		var request = this.gapi.client.request({
			path: "/upload/drive/v2/files/" + fileId,
			method: "PUT",
			params: { uploadType: "media", alt: "json", fields: "etag" },
			headers: {
				"Content-Type": "application/octet-stream",
				...(etag ? { "If-Match": etag } : {}),
			},
			body: fileData
		});
		return this.makePromise<any>(request);
	}

	doRenameRequest(fileId: string, name: string) {
		var request = this.gapi.client.request({
			path: "/drive/v2/files/" + fileId,
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				title: name,
			})
		});
		return this.makePromise<any>(request);
	}

	async renameFile(fileId: string, name: string) {
		let response = await this.doRenameRequest(fileId, name);
		if (response.error) {
			return {
				success: false,
			};
		}
		return {
			success: true,
		};
	}

	async retrieveContent(fileId: string): Promise<FileContent> {
		// alt=media request use different etag values than metadata requests, and uploads need the metadata etag value
		// so we first do a metadata request to get the etag, and also the headRevisionId which should uniquely identify the content
		// then we use the headRevisionId to retreive the actual content, and ignore the etag header in this request
		let metadata = await this.gapi.client.drive.files.get({
			fileId: fileId,
			fields: "etag,headRevisionId"
		});
		let content = await this.gapi.client.drive.files.get({
			fileId: fileId,
			revisionId: metadata.result.headRevisionId,
			alt: "media"
		});
		return {
			body: content.body,
			version: metadata.result.etag
		};
	}

	async saveFile(id: string, text: string, etag: string): Promise<SaveResult> {
		let response = await this.doSaveRequest(id, text, etag);
		if (response.error) {
			if (response.error.code != 412) throw response.error;
			return {
				success: false,
				newVersion: '',
			};
		}
		return {
			success: true,
			newVersion: response.etag,
		};
	}

	async queryFileList(query: string): Promise<FileListEntry[]> {
		let qr = await this.gapi.client.drive.files.list({
			q: query,
			fields: "nextPageToken, items(id, title)"
		});
		// WEB-API typing!
		return qr.result.items.map((x: { title: string }) => ({ ...x, name: x.title }));
	}

	async getFileList(): Promise<FileListEntry[]> {
		return await this.queryFileList("'root' in parents and trashed = false");
	}
}
