"use client";

import { FormEvent, useState, useEffect } from "react";
import { X, Calendar, Clock, Type, ChevronDown, Check, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface RegistrationField {
  id: string;
  field_name: string;
  field_type: "text" | "textarea" | "select" | "radio" | "checkbox" | "date" | "time" | "email" | "phone";
  field_label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation_rules?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  display_order: number;
}

interface RegistrationModalProps {
  eventId: string;
  eventName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (confirmationNumber: string) => void;
}

interface FormData {
  [key: string]: string | string[];
}

interface ValidationErrors {
  [key: string]: string;
}

export default function RegistrationModal({
  eventId,
  eventName,
  isOpen,
  onClose,
  onSuccess,
}: RegistrationModalProps) {
  const [fields, setFields] = useState<RegistrationField[]>([]);
  const [formData, setFormData] = useState<FormData>({});
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [confirmationNumber, setConfirmationNumber] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchFields();
      setShowSuccess(false);
      setConfirmationNumber("");
    }
  }, [isOpen, eventId]);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${eventId}/registration-fields`);

      if (!response.ok) {
        throw new Error("Failed to fetch registration fields");
      }

      const data = await response.json();
      const sortedFields = data.sort((a: RegistrationField, b: RegistrationField) =>
        a.display_order - b.display_order
      );

      setFields(sortedFields);

      // Initialize form data with empty values
      const initialData: FormData = {};
      sortedFields.forEach((field: RegistrationField) => {
        initialData[field.id] = field.field_type === "checkbox" ? [] : "";
      });
      setFormData(initialData);
    } catch (error) {
      console.error("Failed to fetch fields:", error);
      setErrors({ _form: "Failed to load registration form. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const validateField = (field: RegistrationField, value: string | string[]): string | null => {
    // Required validation
    if (field.required) {
      if (Array.isArray(value) && value.length === 0) {
        return `${field.field_label} is required`;
      }
      if (typeof value === "string" && !value.trim()) {
        return `${field.field_label} is required`;
      }
    }

    // Skip further validation if empty and not required
    if (typeof value === "string" && !value.trim()) {
      return null;
    }

    // Type-specific validation
    if (field.field_type === "email" && typeof value === "string") {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) {
        return "Please enter a valid email address";
      }
    }

    if (field.field_type === "phone" && typeof value === "string") {
      const phonePattern = /^[\d\s\-\+\(\)]+$/;
      if (!phonePattern.test(value)) {
        return "Please enter a valid phone number";
      }
    }

    // Custom validation rules
    if (field.validation_rules && typeof value === "string") {
      const { min, max, pattern } = field.validation_rules;

      if (min !== undefined && value.length < min) {
        return `Minimum ${min} characters required`;
      }

      if (max !== undefined && value.length > max) {
        return `Maximum ${max} characters allowed`;
      }

      if (pattern) {
        const regex = new RegExp(pattern);
        if (!regex.test(value)) {
          return "Invalid format";
        }
      }
    }

    return null;
  };

  const handleInputChange = (fieldId: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));

    // Clear error for this field
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const handleCheckboxChange = (fieldId: string, option: string, checked: boolean) => {
    const currentValues = (formData[fieldId] as string[]) || [];
    const newValues = checked
      ? [...currentValues, option]
      : currentValues.filter(v => v !== option);

    handleInputChange(fieldId, newValues);
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    fields.forEach(field => {
      const error = validateField(field, formData[field.id]);
      if (error) {
        newErrors[field.id] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: formData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      const result = await response.json();
      setConfirmationNumber(result.confirmationNumber || result.registrationId);
      setShowSuccess(true);

      if (onSuccess) {
        onSuccess(result.confirmationNumber || result.registrationId);
      }

      // Auto-close after 3 seconds
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (error) {
      console.error("Registration failed:", error);
      setErrors({
        _form: error instanceof Error ? error.message : "Registration failed. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setFormData({});
      setErrors({});
      setShowSuccess(false);
      onClose();
    }
  };

  const renderField = (field: RegistrationField) => {
    const fieldError = errors[field.id];
    const hasError = !!fieldError;

    const baseInputClass = `
      w-full px-4 py-3 rounded-xl
      bg-[var(--surface-2)]
      border transition-all duration-200
      text-[var(--text-primary)]
      placeholder:text-[var(--text-muted)]
      focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent
      ${hasError
        ? "border-[var(--color-error)]"
        : "border-[var(--border-default)] hover:border-[var(--border-strong)]"
      }
    `;

    switch (field.field_type) {
      case "text":
      case "email":
      case "phone":
        return (
          <input
            type={field.field_type === "email" ? "email" : field.field_type === "phone" ? "tel" : "text"}
            id={field.id}
            value={formData[field.id] as string || ""}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClass}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${field.id}-error` : undefined}
          />
        );

      case "textarea":
        return (
          <textarea
            id={field.id}
            value={formData[field.id] as string || ""}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={`${baseInputClass} resize-none`}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${field.id}-error` : undefined}
          />
        );

      case "select":
        return (
          <div className="relative">
            <select
              id={field.id}
              value={formData[field.id] as string || ""}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={`${baseInputClass} appearance-none pr-10 cursor-pointer`}
              aria-invalid={hasError}
              aria-describedby={hasError ? `${field.id}-error` : undefined}
            >
              <option value="">Select an option...</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] pointer-events-none"
            />
          </div>
        );

      case "radio":
        return (
          <div className="space-y-3" role="radiogroup" aria-labelledby={`${field.id}-label`}>
            {field.options?.map((option) => {
              const isSelected = formData[field.id] === option;
              return (
                <label
                  key={option}
                  className={`
                    flex items-center gap-3 p-4 rounded-xl cursor-pointer
                    border transition-all duration-200
                    ${isSelected
                      ? "border-[var(--accent-primary)] bg-[var(--surface-3)]"
                      : "border-[var(--border-default)] bg-[var(--surface-2)] hover:border-[var(--border-strong)]"
                    }
                  `}
                >
                  <input
                    type="radio"
                    name={field.id}
                    value={option}
                    checked={isSelected}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    className="sr-only"
                  />
                  <div className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                    transition-all duration-200
                    ${isSelected
                      ? "border-[var(--accent-primary)]"
                      : "border-[var(--border-strong)]"
                    }
                  `}>
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)]" />
                    )}
                  </div>
                  <span className="text-[var(--text-primary)]">{option}</span>
                </label>
              );
            })}
          </div>
        );

      case "checkbox":
        return (
          <div className="space-y-3" role="group" aria-labelledby={`${field.id}-label`}>
            {field.options?.map((option) => {
              const isChecked = (formData[field.id] as string[] || []).includes(option);
              return (
                <label
                  key={option}
                  className={`
                    flex items-center gap-3 p-4 rounded-xl cursor-pointer
                    border transition-all duration-200
                    ${isChecked
                      ? "border-[var(--accent-primary)] bg-[var(--surface-3)]"
                      : "border-[var(--border-default)] bg-[var(--surface-2)] hover:border-[var(--border-strong)]"
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => handleCheckboxChange(field.id, option, e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`
                    w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0
                    transition-all duration-200
                    ${isChecked
                      ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]"
                      : "border-[var(--border-strong)]"
                    }
                  `}>
                    {isChecked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  </div>
                  <span className="text-[var(--text-primary)]">{option}</span>
                </label>
              );
            })}
          </div>
        );

      case "date":
        return (
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="date"
              id={field.id}
              value={formData[field.id] as string || ""}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={`${baseInputClass} pl-11`}
              aria-invalid={hasError}
              aria-describedby={hasError ? `${field.id}-error` : undefined}
            />
          </div>
        );

      case "time":
        return (
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="time"
              id={field.id}
              value={formData[field.id] as string || ""}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={`${baseInputClass} pl-11`}
              aria-invalid={hasError}
              aria-describedby={hasError ? `${field.id}-error` : undefined}
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[var(--z-modal-backdrop)]"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="w-full max-w-2xl bg-[var(--surface-1)] rounded-2xl shadow-2xl my-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[var(--border-default)]">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                    Event Registration
                  </h2>
                  <p className="text-[var(--text-muted)] text-sm">{eventName}</p>
                </div>
                <button
                  onClick={handleClose}
                  disabled={submitting}
                  className="p-2 rounded-full hover:bg-[var(--surface-3)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-[var(--text-muted)]" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 className="w-8 h-8 text-[var(--accent-primary)] animate-spin" />
                    <p className="text-[var(--text-muted)]">Loading registration form...</p>
                  </div>
                ) : showSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-12 space-y-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10 text-[var(--color-success)]" />
                    </div>
                    <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                      Registration Successful!
                    </h3>
                    <p className="text-[var(--text-secondary)] text-center">
                      Thank you for registering. A confirmation email has been sent to you.
                    </p>
                    {confirmationNumber && (
                      <div className="mt-4 p-4 bg-[var(--surface-2)] rounded-xl border border-[var(--border-default)]">
                        <p className="text-sm text-[var(--text-muted)] mb-1">Confirmation Number</p>
                        <p className="text-xl font-mono font-bold text-[var(--accent-primary)]">
                          {confirmationNumber}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {errors._form && (
                      <div className="flex items-start gap-3 p-4 bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-[var(--color-error)] flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-[var(--color-error)]">{errors._form}</p>
                      </div>
                    )}

                    {fields.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-[var(--text-muted)]">
                          No registration fields configured for this event.
                        </p>
                      </div>
                    ) : (
                      fields.map((field) => (
                        <div key={field.id} className="space-y-2">
                          <label
                            id={`${field.id}-label`}
                            htmlFor={field.id}
                            className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]"
                          >
                            {field.field_label}
                            {field.required && (
                              <span className="text-[var(--color-error)]" aria-label="required">
                                *
                              </span>
                            )}
                          </label>

                          {renderField(field)}

                          {errors[field.id] && (
                            <p
                              id={`${field.id}-error`}
                              className="flex items-center gap-2 text-sm text-[var(--color-error)]"
                              role="alert"
                            >
                              <AlertCircle className="w-4 h-4 flex-shrink-0" />
                              {errors[field.id]}
                            </p>
                          )}
                        </div>
                      ))
                    )}

                    {fields.length > 0 && (
                      <div className="flex gap-3 pt-4">
                        <button
                          type="button"
                          onClick={handleClose}
                          disabled={submitting}
                          className="flex-1 px-6 py-3 rounded-xl border border-[var(--border-default)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)] text-[var(--text-primary)] font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submitting || fields.length === 0}
                          className="flex-1 px-6 py-3 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Submit Registration"
                          )}
                        </button>
                      </div>
                    )}
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
