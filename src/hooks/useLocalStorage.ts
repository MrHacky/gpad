export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (newValue: T) => void] {
  // The initialValue arg is only used if there is nothing in localStorage ...
  // ... otherwise we use the value in localStorage so state persist through a page refresh.
  function getValue(): T {
    let stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : initialValue;
  }

  function updateValue(newValue: T) {
    window.localStorage.setItem(key, JSON.stringify(newValue));
  }

  return [getValue(), updateValue];
}
