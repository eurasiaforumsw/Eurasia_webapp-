"use client";

import { memo, useEffect, useRef } from "react";

interface BulkSelectCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
}

export const BulkSelectCheckbox = memo(function BulkSelectCheckbox({
  checked,
  indeterminate = false,
  onChange,
  ariaLabel,
}: BulkSelectCheckboxProps) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  // Set indeterminate state (can't be done via JSX prop)
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <label className="efsw-admin-bulk-checkbox">
      <input
        ref={checkboxRef}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={ariaLabel}
        className="efsw-admin-bulk-checkbox__input"
      />
      <span className="efsw-admin-bulk-checkbox__box" aria-hidden="true">
        {indeterminate ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 6H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : checked ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
    </label>
  );
});
