import { unstable_batchedUpdates as batch } from "react-dom";
import { useState } from "react";

export function useAsyncState<DataFormat, IdFormat>(
	initial: DataFormat,
	id: IdFormat,
	fetchDataFrom: (i: IdFormat) => Promise<DataFormat>
) {
	let [isFetching, setIsFetching] = useState(false);
	let [isInvalidated, setIsInvalidated] = useState(false);
	let [currentId, setCurrentId] = useState(undefined);
	let [currentData, setCurrentData] = useState(initial);
	let [currentError, setCurrentError] = useState(null);

	if (isFetching) {
		if (id !== currentId) {
			setIsInvalidated(true);
			setCurrentId(id);
		}
	} else if (isInvalidated || id !== currentId) {
		setIsFetching(true);
		setIsInvalidated(false);
		setCurrentId(id);
		fetchDataFrom(id).then(
			newdata => {
				console.log("fetched new data for: ", id, newdata);
				batch(() => {
					setCurrentData(newdata);
					setCurrentError(null);
					setIsFetching(false);
				});
			},
			error => {
				setCurrentError(error);
				setIsFetching(false);
			}
		);
	}

	return {
		data: currentData,
		error: currentError,
		isFetching,
		isInvalidated,
		doInvalidate: () => setIsInvalidated(true)
	};
}
