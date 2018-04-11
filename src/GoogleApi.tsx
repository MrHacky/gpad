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

export class GoogleApi {
	props: Props;
	gapi: any;

	constructor(props: Props) {
		this.props = props;
		this.props.onChange('loading');

		let script = document.createElement('script');
		script.async = true;
		script.defer = true;
		script.src = "https://apis.google.com/js/api.js";
		script.onload = () => this.scriptloaded(script);
		document.head.appendChild(script);
	}

	makePromise<T>(request): Promise<T> {
		return new Promise<T>((resolve) => {
			request.execute(resolve);
		});
	}

	scriptloaded(script) {
		script.onload = function () { };
		script.parentNode.removeChild(script);
		let w = window as any;
		let gapi = w.gapi;
		//w.gapi = undefined;
		this.gapi = gapi;
		this.gapi.load('client:auth2', () => this.initclient());
	}

	initclient() {
		this.gapi.client.init({
			apiKey: API_KEY,
			clientId: CLIENT_ID,
			discoveryDocs: DISCOVERY_DOCS,
			scope: SCOPES
		}).then(() => {
			// Listen for sign-in state changes.
			this.gapi.auth2.getAuthInstance().isSignedIn.listen((s) => this.updateSigninStatus(s));

			// Handle the initial sign-in state.
			this.updateSigninStatus(this.gapi.auth2.getAuthInstance().isSignedIn.get());
		});
	}

	updateSigninStatus(isSignedIn) {
		this.props.onChange(isSignedIn ? "in" : "out");
	}

	signin() {
		this.props.onChange('loading');
		this.gapi.auth2.getAuthInstance().signIn();
	}

	signout() {
		this.props.onChange('loading');
		this.gapi.auth2.getAuthInstance().signOut();
	}

	/**
	 * Insert new empty file.
	 *
	 * @param {Name} fileName File name to create
	 * @param {Function} callback Function to call when the request is complete.
	 */
	insertFile(fileName, callback) {
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
			'body': multipartRequestBody});
		if (!callback) {
			callback = function(file) {
			console.log(file)
			};
		}
		request.execute(callback);
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
