import { useState } from "react";

export function useLocalStorage<T>(
	key: string,
	initialValue: T
): [() => T, (value: T) => void] {
	const getValue = (): T => {
		const storedValue = window.localStorage.getItem(key);
		//console.log("Get", key, storedValue);
		if (typeof storedValue !== "string")
			return initialValue;
		else
			return JSON.parse(storedValue);
	};

	const setValue = (value: T) => {
		//console.log("Set", key, value);
		window.localStorage.setItem(key, JSON.stringify(value));
	};

	return [getValue, setValue];
}
