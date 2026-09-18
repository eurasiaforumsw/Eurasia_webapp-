import { useEffect, useState } from "react";

/**
 * Custom hook to debounce a fast-changing value (e.g. search query)
 * @param value The raw input value
 * @param delay The debounce delay in milliseconds (default: 250ms)
 */
export function useDebounce<T>(value: T, delay: number = 250): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
