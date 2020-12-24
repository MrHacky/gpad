import { StorageApi } from "./../storageApi";

function delay(delayMs: number): Promise<void> {
	return new Promise<void>((resolve) => {
		window.setTimeout(resolve, delayMs);
	});
}

function wrapImpl<F extends (...args: any[]) => Promise<any>>(f: any, delayMs: number): F {
	let r = async (...args: any[]): Promise<any> => {
		await delay(delayMs);
		let ret = f(...args);
		await delay(delayMs);
		return ret;
	};
	// don't really understand why the casts are needed...
	return r as any as F;
}

// And can't seem to get typing to work, either
function wrap(f: any, delayMs: number): any {
	return wrapImpl(f, delayMs);
}

export function useDelayedStorageApi(api: StorageApi, delayMs: number) {
	return {
		state: api.state,
		signin         : wrap(api.signin         , delayMs),
		signout        : wrap(api.signout        , delayMs),
		retrieveContent: wrap(api.retrieveContent, delayMs),
		saveFile       : wrap(api.saveFile       , delayMs),
		getFileList    : wrap(api.getFileList    , delayMs),
		createFile     : wrap(api.createFile     , delayMs),
		renameFile     : wrap(api.renameFile     , delayMs),
	};
}
