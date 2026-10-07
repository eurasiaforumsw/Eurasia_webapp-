"use client";

import { useState, useMemo } from "react";
import { AdminContentItem, AdminContentKind, AdminContentStatus } from "@/lib/admin-data";
import { AdvancedFilterPanel, Filter } from "./filters/AdvancedFilterPanel";

interface ContentAdvancedFiltersProps {
  content: AdminContentItem[];
  onFilterChange: (filtered: AdminContentItem[]) => void;
}

const KIND_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "news", label: "News" },
  { value: "document", label: "Document" },
  { value: "event", label: "Event" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

export function ContentAdvancedFilters({ content, onFilterChange }: ContentAdvancedFiltersProps) {
  // Extract unique categories
  const categoryOptions = useMemo(() => {
    const cats = new Set<string>();
    content.forEach((c) => {
      if (c.category) cats.add(c.category);
    });
    return Array.from(cats).sort().map((cat) => ({ value: cat, label: cat }));
  }, [content]);

  const filterConfig: Filter[] = [
    {
      id: "search",
      label: "Search",
      type: "search",
      placeholder: "Search titles, summaries, tags...",
      defaultValue: "",
    },
    {
      id: "kind",
      label: "Content Type",
      type: "select",
      options: KIND_OPTIONS,
      defaultValue: "all",
    },
    {
      id: "status",
      label: "Status",
      type: "select",
      options: STATUS_OPTIONS,
      defaultValue: "all",
    },
    {
      id: "categories",
      label: "Categories",
      type: "multiselect",
      options: categoryOptions,
      defaultValue: [],
    },
    {
      id: "dateRange",
      label: "Published Date",
      type: "daterange",
      defaultValue: { from: null, to: null },
    },
    {
      id: "author",
      label: "Author",
      type: "search",
      placeholder: "Filter by author...",
      defaultValue: "",
    },
    {
      id: "targetMembershipTypes",
      label: "Target Membership",
      type: "multiselect",
      options: [
        { value: "professional", label: "Professional" },
        { value: "student", label: "Student" },
        { value: "institutional", label: "Institutional" },
      ],
      defaultValue: [],
    },
  ];

  const [filterValues, setFilterValues] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    filterConfig.forEach((f) => {
      initial[f.id] = f.defaultValue;
    });
    return initial;
  });

  // Apply filters
  const filtered = useMemo(() => {
    let result = content;

    // Search
    if (filterValues.search?.trim()) {
      const query = filterValues.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.title?.toLowerCase().includes(query) ||
          c.summary?.toLowerCase().includes(query) ||
          c.tags?.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Kind
    if (filterValues.kind && filterValues.kind !== "all") {
      result = result.filter((c) => c.kind === filterValues.kind);
    }

    // Status
    if (filterValues.status && filterValues.status !== "all") {
      result = result.filter((c) => c.status === filterValues.status);
    }

    // Categories
    if (filterValues.categories?.length > 0) {
      result = result.filter((c) => c.category && filterValues.categories.includes(c.category));
    }

    // Date range
    if (filterValues.dateRange?.from || filterValues.dateRange?.to) {
      result = result.filter((c) => {
        if (!c.publishAt) return false;
        const date = new Date(c.publishAt);
        if (filterValues.dateRange.from && date < filterValues.dateRange.from) return false;
        if (filterValues.dateRange.to && date > filterValues.dateRange.to) return false;
        return true;
      });
    }

    // Author
    if (filterValues.author?.trim()) {
      const authorQuery = filterValues.author.toLowerCase();
      result = result.filter((c) => c.author?.toLowerCase().includes(authorQuery));
    }

    // Target membership types
    if (filterValues.targetMembershipTypes?.length > 0) {
      result = result.filter((c) =>
        c.targetMembershipTypes?.some((type) => filterValues.targetMembershipTypes.includes(type))
      );
    }

    return result;
  }, [content, filterValues]);

  // Notify parent
  useMemo(() => {
    onFilterChange(filtered);
  }, [filtered, onFilterChange]);

  const handleReset = () => {
    const reset: Record<string, any> = {};
    filterConfig.forEach((f) => {
      reset[f.id] = f.defaultValue;
    });
    setFilterValues(reset);
  };

  return (
    <AdvancedFilterPanel
      filters={filterConfig}
      values={filterValues}
      onChange={setFilterValues}
      onReset={handleReset}
    />
  );
}
