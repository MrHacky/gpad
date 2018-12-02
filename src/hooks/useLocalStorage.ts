import { useState } from "react";

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  // The initialValue arg is only used if there is nothing in localStorage ...
  // ... otherwise we use the value in localStorage so state persist through a page refresh.
  const [currentValue, setInnerValue] = useState<T>(() => {
    const storedValue = window.localStorage.getItem(key);
    if (typeof storedValue !== "string") {
      localStorage.setItem(key, JSON.stringify(initialValue));
      return initialValue;
    } else {
      return JSON.parse(storedValue);
    }
  });

  const setValue = value => {
    setInnerValue(value);
    window.localStorage.setItem(key, JSON.stringify(currentValue));
  };

  return [currentValue, setValue];
}
