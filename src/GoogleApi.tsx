// Client ID and API key from the Developer Console
var CLIENT_ID = '236851809100-miu80r5sj3hjbrfv9gic09pj8udrthpg.apps.googleusercontent.com';
var API_KEY = 'AIzaSyAkB2oP1tvUHfmVZKIKe_iju12iU_R1Scw';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly';

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
}
