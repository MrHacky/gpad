import { unstable_batchedUpdates as batch } from "react-dom";
import { useState } from "react";

export function useAsyncState<T, I>(
  initial: T,
  id: I,
  cb: (i: I) => Promise<T>
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
    cb(id).then(
      newdata => {
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
