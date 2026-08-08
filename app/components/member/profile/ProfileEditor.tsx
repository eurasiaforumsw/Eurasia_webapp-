'use client';

import { useState } from 'react';

interface ProfileField {
  id: string;
  label: string;
  value: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select';
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

interface ProfileEditorProps {
  fields: ProfileField[];
  onSave: (data: Record<string, string>) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ProfileEditor({
  fields,
  onSave,
  onCancel,
  isLoading = false
}: ProfileEditorProps) {
  const [formData, setFormData] = useState<Record<string, string>>(
    fields.reduce((acc, field) => ({ ...acc, [field.id]: field.value }), {})
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
    setIsDirty(true);
    if (errors[id]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach(field => {
      if (field.required && !formData[field.id]?.trim()) {
        newErrors[field.id] = `${field.label} is required`;
      }

      if (field.type === 'email' && formData[field.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.id])) {
          newErrors[field.id] = 'Invalid email address';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await onSave(formData);
      setIsDirty(false);
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handleReset = () => {
    setFormData(fields.reduce((acc, field) => ({ ...acc, [field.id]: field.value }), {}));
    setErrors({});
    setIsDirty(false);
    onCancel?.();
  };

  return (
    <>
      <style jsx>{`
        .profile-editor {
          --surface-1: #0A0D12;
          --surface-2: #0F131C;
          --surface-3: #161D2B;
          --surface-4: #1E2636;
          --accent: #38BDF8;
          --accent-hover: #7DD3FC;
          --text-primary: #F8FAFC;
          --text-secondary: #CBD5E1;
          --text-muted: #64748B;
          --error: #EF4444;
          --radius-md: 12px;
          --radius-full: 999px;
          --spacing-2: 0.5rem;
          --spacing-3: 0.75rem;
          --spacing-4: 1rem;
          --spacing-6: 1.5rem;
        }

        .profile-editor {
          background: var(--surface-2);
          border-radius: var(--radius-md);
          padding: var(--spacing-6);
          font-family: system-ui, -apple-system, sans-serif;
        }

        .profile-editor__form {
          display: grid;
          gap: var(--spacing-6);
        }

        .profile-editor__fields {
          display: grid;
          gap: var(--spacing-4);
        }

        @media (min-width: 768px) {
          .profile-editor__fields {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .profile-editor__field {
          display: grid;
          gap: var(--spacing-2);
        }

        .profile-editor__field--full {
          grid-column: 1 / -1;
        }

        .profile-editor__label {
          font-size: clamp(0.875rem, 1.5vw, 1rem);
          font-weight: 500;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: var(--spacing-2);
        }

        .profile-editor__required {
          color: var(--error);
        }

        .profile-editor__input,
        .profile-editor__textarea,
        .profile-editor__select {
          width: 100%;
          padding: var(--spacing-3) var(--spacing-4);
          background: var(--surface-3);
          border: 1px solid var(--surface-4);
          border-radius: calc(var(--radius-md) * 0.75);
          color: var(--text-primary);
          font-size: clamp(0.875rem, 1.5vw, 1rem);
          transition: all 0.2s ease;
        }

        .profile-editor__input:focus,
        .profile-editor__textarea:focus,
        .profile-editor__select:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.1);
        }

        .profile-editor__input:disabled,
        .profile-editor__textarea:disabled,
        .profile-editor__select:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .profile-editor__input--error,
        .profile-editor__textarea--error,
        .profile-editor__select--error {
          border-color: var(--error);
        }

        .profile-editor__textarea {
          min-height: 120px;
          resize: vertical;
          font-family: inherit;
        }

        .profile-editor__error {
          font-size: clamp(0.75rem, 1.2vw, 0.875rem);
          color: var(--error);
          margin-top: var(--spacing-2);
        }

        .profile-editor__actions {
          display: flex;
          gap: var(--spacing-3);
          justify-content: flex-end;
          padding-top: var(--spacing-4);
          border-top: 1px solid var(--surface-3);
        }

        .profile-editor__button {
          padding: var(--spacing-3) var(--spacing-6);
          border-radius: var(--radius-full);
          font-size: clamp(0.875rem, 1.5vw, 1rem);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .profile-editor__button--primary {
          background: var(--accent);
          color: var(--surface-1);
        }

        .profile-editor__button--primary:hover:not(:disabled) {
          background: var(--accent-hover);
        }

        .profile-editor__button--primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .profile-editor__button--secondary {
          background: var(--surface-3);
          color: var(--text-primary);
        }

        .profile-editor__button--secondary:hover:not(:disabled) {
          background: var(--surface-4);
        }

        .profile-editor__dirty-indicator {
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-2);
          font-size: clamp(0.75rem, 1.2vw, 0.875rem);
          color: var(--text-muted);
          margin-right: auto;
        }

        .profile-editor__dirty-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent);
        }
      `}</style>

      <div className="profile-editor">
        <form className="profile-editor__form" onSubmit={handleSubmit}>
          <div className="profile-editor__fields">
            {fields.map(field => (
              <div
                key={field.id}
                className={`profile-editor__field ${
                  field.type === 'textarea' ? 'profile-editor__field--full' : ''
                }`}
              >
                <label htmlFor={field.id} className="profile-editor__label">
                  {field.label}
                  {field.required && <span className="profile-editor__required">*</span>}
                </label>

                {field.type === 'textarea' ? (
                  <textarea
                    id={field.id}
                    value={formData[field.id] || ''}
                    onChange={e => handleChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    disabled={field.disabled || isLoading}
                    required={field.required}
                    className={`profile-editor__textarea ${
                      errors[field.id] ? 'profile-editor__textarea--error' : ''
                    }`}
                  />
                ) : field.type === 'select' ? (
                  <select
                    id={field.id}
                    value={formData[field.id] || ''}
                    onChange={e => handleChange(field.id, e.target.value)}
                    disabled={field.disabled || isLoading}
                    required={field.required}
                    className={`profile-editor__select ${
                      errors[field.id] ? 'profile-editor__select--error' : ''
                    }`}
                  >
                    <option value="">Select...</option>
                    {field.options?.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={field.id}
                    type={field.type}
                    value={formData[field.id] || ''}
                    onChange={e => handleChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    disabled={field.disabled || isLoading}
                    required={field.required}
                    className={`profile-editor__input ${
                      errors[field.id] ? 'profile-editor__input--error' : ''
                    }`}
                  />
                )}

                {errors[field.id] && (
                  <div className="profile-editor__error" role="alert">
                    {errors[field.id]}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="profile-editor__actions">
            {isDirty && (
              <div className="profile-editor__dirty-indicator">
                <span className="profile-editor__dirty-dot" aria-hidden="true" />
                Unsaved changes
              </div>
            )}
            <button
              type="button"
              onClick={handleReset}
              disabled={isLoading || !isDirty}
              className="profile-editor__button profile-editor__button--secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !isDirty}
              className="profile-editor__button profile-editor__button--primary"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
