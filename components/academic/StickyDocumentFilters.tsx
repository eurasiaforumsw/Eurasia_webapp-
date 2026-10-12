"use client";

import { useState } from "react";
import {
  Search,
  X,
  ChevronDown,
  Grid3x3,
  List,
  SlidersHorizontal,
} from "lucide-react";

type FilterProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  categories: { value: string; label: string; count: number }[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  allTags: string[];
  sortBy: string;
  onSortChange: (sort: string) => void;
  sortOptions: { value: string; label: string }[];
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  resultsCount: number;
};

export function StickyDocumentFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  selectedTags,
  onTagsChange,
  allTags,
  sortBy,
  onSortChange,
  sortOptions,
  viewMode,
  onViewModeChange,
  resultsCount,
}: FilterProps) {
  const [showFilters, setShowFilters] = useState(false);
  const activeFiltersCount =
    (selectedCategory ? 1 : 0) + selectedTags.length + (searchQuery ? 1 : 0);
  const clearFilters = () => {
    onSearchChange("");
    onCategoryChange(null);
    onTagsChange([]);
  };

  return (
    <div
      className="sticky-filters"
      onKeyDown={(event) => {
        if (event.key === "Escape") setShowFilters(false);
      }}
    >
      <div className="sticky-filters__inner">
        <div className="sticky-filters__search">
          <label htmlFor="library-search" className="sr-only">
            Search the library
          </label>
          <Search
            size={18}
            className="sticky-filters__search-icon"
            aria-hidden="true"
          />
          <input
            id="library-search"
            name="library-search"
            type="search"
            placeholder="Search a title, author, or topic…"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className="sticky-filters__search-input"
            autoComplete="off"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="sticky-filters__search-clear"
              aria-label="Clear search"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="sticky-filters__controls">
          <button
            type="button"
            onClick={() => setShowFilters((previous) => !previous)}
            className={`sticky-filters__btn ${showFilters ? "is-active" : ""}`}
            aria-expanded={showFilters}
            aria-controls="library-topic-filters"
          >
            <SlidersHorizontal size={16} aria-hidden="true" />
            Topics
            {selectedTags.length > 0 && (
              <span className="sticky-filters__badge">
                {selectedTags.length}
              </span>
            )}
          </button>
          <div className="sticky-filters__select-wrapper">
            <label htmlFor="library-sort" className="sr-only">
              Sort documents
            </label>
            <select
              id="library-sort"
              value={sortBy}
              onChange={(event) => onSortChange(event.target.value)}
              className="sticky-filters__select"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="sticky-filters__select-icon"
              aria-hidden="true"
            />
          </div>
          <div
            className="sticky-filters__view-toggle"
            role="group"
            aria-label="Document layout"
          >
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={viewMode === "grid" ? "is-active" : ""}
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
            >
              <Grid3x3 size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("list")}
              className={viewMode === "list" ? "is-active" : ""}
              aria-label="List view"
              aria-pressed={viewMode === "list"}
            >
              <List size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
      <div className="sticky-filters__bottom">
        <div
          className="sticky-filters__categories"
          role="group"
          aria-label="Document categories"
        >
          <button
            type="button"
            className={`filter-pill ${selectedCategory === null ? "is-active" : ""}`}
            onClick={() => onCategoryChange(null)}
            aria-pressed={selectedCategory === null}
          >
            All documents
          </button>
          {categories.map((category) => (
            <button
              type="button"
              key={category.value}
              className={`filter-pill ${selectedCategory === category.value ? "is-active" : ""}`}
              onClick={() =>
                onCategoryChange(
                  selectedCategory === category.value ? null : category.value,
                )
              }
              aria-pressed={selectedCategory === category.value}
            >
              {category.label}
              <span>{category.count}</span>
            </button>
          ))}
        </div>
        <span
          className="sticky-filters__results"
          role="status"
          aria-live="polite"
        >
          {resultsCount} {resultsCount === 1 ? "document" : "documents"}
        </span>
      </div>
      {showFilters && (
        <div
          id="library-topic-filters"
          className="sticky-filters__panel"
          data-lenis-prevent
        >
          <div className="sticky-filters__panel-header">
            <span>Filter by topic</span>
            {activeFiltersCount > 0 && (
              <button type="button" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
          <div className="sticky-filters__tags">
            {allTags.length ? (
              allTags.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() =>
                    onTagsChange(
                      selectedTags.includes(tag)
                        ? selectedTags.filter((value) => value !== tag)
                        : [...selectedTags, tag],
                    )
                  }
                  className={`sticky-filters__tag ${selectedTags.includes(tag) ? "is-active" : ""}`}
                  aria-pressed={selectedTags.includes(tag)}
                >
                  {tag}
                </button>
              ))
            ) : (
              <p>Topics appear when documents are published.</p>
            )}
          </div>
        </div>
      )}
      {!showFilters && selectedTags.length > 0 && (
        <div className="sticky-filters__active-tags">
          {selectedTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() =>
                onTagsChange(selectedTags.filter((value) => value !== tag))
              }
              aria-label={`Remove ${tag} filter`}
            >
              {tag}
              <X size={14} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
