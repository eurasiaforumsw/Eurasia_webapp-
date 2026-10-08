"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  X,
  ChevronDown,
  Grid3x3,
  List,
  Tag,
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
  const [isSticky, setIsSticky] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const activeFiltersCount =
    (selectedCategory ? 1 : 0) +
    selectedTags.length +
    (searchQuery ? 1 : 0);

  const clearFilters = () => {
    onSearchChange("");
    onCategoryChange(null);
    onTagsChange([]);
  };

  const toggleTag = (tag: string) => {
    onTagsChange(
      selectedTags.includes(tag)
        ? selectedTags.filter((t) => t !== tag)
        : [...selectedTags, tag]
    );
  };

  return (
    <>
      <div
        className={`sticky-filters ${isSticky ? "is-sticky" : ""}`}
        data-sticky={isSticky}
      >
        <div className="sticky-filters__inner">
          {/* Search */}
          <div className="sticky-filters__search">
            <Search size={18} className="sticky-filters__search-icon" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="sticky-filters__search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="sticky-filters__search-clear"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Select */}
          <div className="sticky-filters__select-wrapper">
            <select
              value={selectedCategory || ""}
              onChange={(e) =>
                onCategoryChange(e.target.value || null)
              }
              className="sticky-filters__select"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label} ({cat.count})
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="sticky-filters__select-icon" />
          </div>

          {/* Controls */}
          <div className="sticky-filters__controls">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`sticky-filters__btn ${showFilters ? "is-active" : ""}`}
            >
              <SlidersHorizontal size={16} />
              <span className="sticky-filters__btn-label">Tags</span>
              {activeFiltersCount > 0 && (
                <span className="sticky-filters__badge">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <div className="sticky-filters__divider" />

            <div className="sticky-filters__select-wrapper sticky-filters__select-wrapper--sort">
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="sticky-filters__select sticky-filters__select--compact"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="sticky-filters__select-icon" />
            </div>

            <div className="sticky-filters__view-toggle">
              <button
                type="button"
                onClick={() => onViewModeChange("grid")}
                className={viewMode === "grid" ? "is-active" : ""}
                aria-label="Grid view"
              >
                <Grid3x3 size={16} />
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange("list")}
                className={viewMode === "list" ? "is-active" : ""}
                aria-label="List view"
              >
                <List size={16} />
              </button>
            </div>
          </div>

          {/* Results count */}
          <div className="sticky-filters__results">
            <span className="sticky-filters__count">{resultsCount}</span>
            <span className="sticky-filters__label">
              {resultsCount === 1 ? "document" : "documents"}
            </span>
          </div>
        </div>

        {/* Tag Filter Panel */}
        {showFilters && (
          <div className="sticky-filters__panel">
            <div className="sticky-filters__panel-inner">
              <div className="sticky-filters__panel-header">
                <span className="sticky-filters__panel-title">Filter by topic</span>
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="sticky-filters__panel-clear"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="sticky-filters__tags">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`sticky-filters__tag ${
                      selectedTags.includes(tag) ? "is-active" : ""
                    }`}
                  >
                    <Tag size={12} />
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Spacer for sticky positioning */}
      {isSticky && <div className="sticky-filters__spacer" />}
    </>
  );
}
