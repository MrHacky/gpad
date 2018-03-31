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

	async retrieveFileInfo(fileId): Promise<any> {
		return await this.gapi.client.drive.files.get({
			'fileId': fileId,
			'alt': 'media',
			'fields': 'etag',
		});
	}

	async retrieveContent(fileId): Promise<string> {
		return JSON.stringify(await this.retrieveFileInfo(fileId));
	}
}
