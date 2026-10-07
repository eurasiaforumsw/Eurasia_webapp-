import { useEffect, useState } from "react";

export interface FilterPreset {
  name: string;
  filters: Record<string, any>;
  createdAt: number;
}

interface UseFilterPersistenceOptions<T> {
  viewName: string;
  defaultValues: T;
  enableUrlState?: boolean;
}

interface UseFilterPersistenceReturn<T> {
  filterValues: T;
  setFilterValues: (values: T | ((prev: T) => T)) => void;
  presets: FilterPreset[];
  savePreset: (name: string) => void;
  deletePreset: (name: string) => void;
  loadPreset: (preset: FilterPreset) => void;
  clearFilters: () => void;
}

/**
 * Hook for persisting filter state to localStorage with optional URL sync
 *
 * Features:
 * - Auto-save filter values to localStorage on change
 * - Save/load named presets
 * - Optional URL query param sync for shareable filtered views
 * - Automatic hydration on mount
 */
export function useFilterPersistence<T extends Record<string, any>>({
  viewName,
  defaultValues,
  enableUrlState = false,
}: UseFilterPersistenceOptions<T>): UseFilterPersistenceReturn<T> {
  const storageKey = `efsw-admin-filters-${viewName}`;
  const presetsKey = `efsw-admin-filter-presets-${viewName}`;

  // Initialize filter values from localStorage or URL
  const [filterValues, setFilterValuesState] = useState<T>(() => {
    // Priority 1: URL params (if enabled)
    if (enableUrlState && typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlFilters = params.get("filters");
        if (urlFilters) {
          const parsed = JSON.parse(decodeURIComponent(urlFilters));
          return { ...defaultValues, ...parsed };
        }
      } catch (error) {
        console.warn("Failed to parse URL filters:", error);
      }
    }

    // Priority 2: localStorage
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          return { ...defaultValues, ...parsed };
        }
      } catch (error) {
        console.warn("Failed to load filters from localStorage:", error);
      }
    }

    return defaultValues;
  });

  // Load presets from localStorage
  const [presets, setPresets] = useState<FilterPreset[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(presetsKey);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (error) {
        console.warn("Failed to load presets from localStorage:", error);
      }
    }
    return [];
  });

  // Save filter values to localStorage (and optionally URL) on change
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // Save to localStorage
      localStorage.setItem(storageKey, JSON.stringify(filterValues));

      // Update URL if enabled
      if (enableUrlState) {
        const params = new URLSearchParams(window.location.search);
        const encoded = encodeURIComponent(JSON.stringify(filterValues));
        params.set("filters", encoded);

        // Use replaceState to avoid polluting browser history
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, "", newUrl);
      }
    } catch (error) {
      console.warn("Failed to save filters:", error);
    }
  }, [filterValues, storageKey, enableUrlState]);

  // Wrapper to maintain compatibility with setState pattern
  const setFilterValues = (values: T | ((prev: T) => T)) => {
    if (typeof values === "function") {
      setFilterValuesState((prev) => (values as (prev: T) => T)(prev));
    } else {
      setFilterValuesState(values);
    }
  };

  // Save current filters as a named preset
  const savePreset = (name: string) => {
    if (!name.trim()) return;

    const newPreset: FilterPreset = {
      name: name.trim(),
      filters: filterValues,
      createdAt: Date.now(),
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);

    try {
      localStorage.setItem(presetsKey, JSON.stringify(updatedPresets));
    } catch (error) {
      console.warn("Failed to save preset:", error);
    }
  };

  // Delete a preset by name
  const deletePreset = (name: string) => {
    const updatedPresets = presets.filter((p) => p.name !== name);
    setPresets(updatedPresets);

    try {
      localStorage.setItem(presetsKey, JSON.stringify(updatedPresets));
    } catch (error) {
      console.warn("Failed to delete preset:", error);
    }
  };

  // Load a preset
  const loadPreset = (preset: FilterPreset) => {
    setFilterValues({ ...defaultValues, ...preset.filters } as T);
  };

  // Clear all filters back to defaults
  const clearFilters = () => {
    setFilterValues(defaultValues);
  };

  return {
    filterValues,
    setFilterValues,
    presets,
    savePreset,
    deletePreset,
    loadPreset,
    clearFilters,
  };
}
