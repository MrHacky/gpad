export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (u: (x: T) => T) => void] {
  // The initialValue arg is only used if there is nothing in localStorage ...
  // ... otherwise we use the value in localStorage so state persist through a page refresh.
  function getValue(): T {
    let stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : initialValue;
  }

  function updateValue(updater: (x: T) => T) {
    // TODO Why do we use a function here? We don't need a prev value?, that's getValue() already.
    const prev = getValue();
    const next = updater(prev);
    window.localStorage.setItem(key, JSON.stringify(next));
  }

  return [getValue(), updateValue];
}
