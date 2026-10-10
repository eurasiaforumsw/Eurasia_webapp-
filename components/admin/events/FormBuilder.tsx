"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  GripVertical,
  Save,
  Type,
  AlignLeft,
  List,
  Circle,
  CheckSquare,
  Calendar,
  Clock,
  Eye,
  ChevronUp,
  ChevronDown,
  Mail,
  Phone,
  Hash,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

type FieldType = "text" | "textarea" | "select" | "radio" | "checkbox" | "date" | "time" | "email" | "phone" | "number";

interface FieldOption {
  id: string;
  label: string;
}

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder: string;
  options: FieldOption[];
  required: boolean;
  order: number;
}

interface FormBuilderProps {
  eventId: string;
  onClose?: () => void;
}

const FIELD_TYPE_CONFIG: Record<FieldType, { icon: any; label: string; hasOptions: boolean; placeholder: string }> = {
  text: { icon: Type, label: "Short Text", hasOptions: false, placeholder: "Enter text..." },
  textarea: { icon: AlignLeft, label: "Long Text", hasOptions: false, placeholder: "Enter detailed response..." },
  select: { icon: List, label: "Dropdown", hasOptions: true, placeholder: "Select an option..." },
  radio: { icon: Circle, label: "Radio Buttons", hasOptions: true, placeholder: "Choose one option" },
  checkbox: { icon: CheckSquare, label: "Checkboxes", hasOptions: true, placeholder: "Select all that apply" },
  date: { icon: Calendar, label: "Date", hasOptions: false, placeholder: "Select date" },
  time: { icon: Clock, label: "Time", hasOptions: false, placeholder: "Select time" },
  email: { icon: Mail, label: "Email", hasOptions: false, placeholder: "email@example.com" },
  phone: { icon: Phone, label: "Phone", hasOptions: false, placeholder: "+1 (555) 000-0000" },
  number: { icon: Hash, label: "Number", hasOptions: false, placeholder: "Enter number" },
};

export default function FormBuilder({ eventId, onClose }: FormBuilderProps) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<FormField[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchFields();
  }, [eventId]);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${eventId}/registration-fields`);

      if (response.ok) {
        const data = await response.json();
        setFields(data.fields || []);
      } else if (response.status === 404) {
        // No fields yet, start with empty
        setFields([]);
      }
    } catch (error) {
      console.error("Failed to fetch form fields:", error);
      addToast({
        type: "error",
        title: "Failed to load form",
        description: "Could not fetch registration form fields",
      });
    } finally {
      setLoading(false);
    }
  };

  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      label: "",
      placeholder: FIELD_TYPE_CONFIG[type].placeholder,
      options: FIELD_TYPE_CONFIG[type].hasOptions ? [{ id: "opt-1", label: "Option 1" }] : [],
      required: false,
      order: fields.length,
    };
    setFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id).map((f, idx) => ({ ...f, order: idx })));
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const moveField = (id: string, direction: "up" | "down") => {
    const index = fields.findIndex(f => f.id === id);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === fields.length - 1) return;

    const newFields = [...fields];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [newFields[index], newFields[swapIndex]] = [newFields[swapIndex], newFields[index]];

    // Update order
    newFields.forEach((f, idx) => f.order = idx);
    setFields(newFields);
  };

  const addOption = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;

    const newOption: FieldOption = {
      id: `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      label: `Option ${field.options.length + 1}`,
    };

    updateField(fieldId, {
      options: [...field.options, newOption],
    });
  };

  const removeOption = (fieldId: string, optionId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field || field.options.length <= 1) return;

    updateField(fieldId, {
      options: field.options.filter(o => o.id !== optionId),
    });
  };

  const updateOption = (fieldId: string, optionId: string, label: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;

    updateField(fieldId, {
      options: field.options.map(o => o.id === optionId ? { ...o, label } : o),
    });
  };

  const handleSave = async () => {
    // Validation
    const invalidFields = fields.filter(f => !f.label.trim());
    if (invalidFields.length > 0) {
      addToast({
        type: "error",
        title: "Validation Error",
        description: "All fields must have a label",
      });
      return;
    }

    const fieldsWithInvalidOptions = fields.filter(
      f => FIELD_TYPE_CONFIG[f.type].hasOptions && f.options.some(o => !o.label.trim())
    );
    if (fieldsWithInvalidOptions.length > 0) {
      addToast({
        type: "error",
        title: "Validation Error",
        description: "All options must have a label",
      });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/events/${eventId}/registration-fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });

      if (!response.ok) {
        throw new Error("Failed to save form");
      }

      addToast({
        type: "success",
        title: "Form saved",
        description: "Registration form fields updated successfully",
      });

      if (onClose) {
        setTimeout(onClose, 1000);
      }
    } catch (error) {
      console.error("Failed to save form:", error);
      addToast({
        type: "error",
        title: "Save failed",
        description: "Could not save registration form",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1E2636] border-t-[#38BDF8]" />
          <p className="text-sm text-[#94A3B8]">Loading form builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      background: "#0A0D12",
      color: "#F8FAFC",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1.5rem 2rem",
        borderBottom: "1px solid #1E2636",
        background: "#0F131C",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "2.5rem",
            height: "2.5rem",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)",
            boxShadow: "0 4px 12px rgba(56, 189, 248, 0.25)",
          }}>
            <List size={20} style={{ color: "#0F131C" }} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#F8FAFC" }}>
              Form Builder
            </h2>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "#94A3B8" }}>
              Design your registration form
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowPreview(!showPreview)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.625rem 1.25rem",
            background: showPreview ? "#38BDF8" : "#1E2636",
            border: "none",
            borderRadius: "8px",
            color: showPreview ? "#0F131C" : "#F8FAFC",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          <Eye size={16} />
          {showPreview ? "Edit" : "Preview"}
        </button>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: showPreview ? "1fr 1fr" : "1fr",
        overflow: "hidden",
      }}>
        {/* Builder Panel */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          borderRight: showPreview ? "1px solid #1E2636" : "none",
        }}>
          {/* Field Type Selector */}
          <div style={{
            padding: "1.5rem 2rem",
            borderBottom: "1px solid #1E2636",
            background: "#0F131C",
          }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94A3B8", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Add Field
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
              gap: "0.5rem",
            }}>
              {(Object.keys(FIELD_TYPE_CONFIG) as FieldType[]).map((type) => {
                const config = FIELD_TYPE_CONFIG[type];
                const Icon = config.icon;
                return (
                  <button
                    key={type}
                    onClick={() => addField(type)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.375rem",
                      padding: "0.75rem 0.5rem",
                      background: "#1E2636",
                      border: "1px solid #2D3748",
                      borderRadius: "8px",
                      color: "#F8FAFC",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#38BDF8";
                      e.currentTarget.style.borderColor = "#38BDF8";
                      e.currentTarget.style.color = "#0F131C";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#1E2636";
                      e.currentTarget.style.borderColor = "#2D3748";
                      e.currentTarget.style.color = "#F8FAFC";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <Icon size={18} />
                    <span>{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fields List */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.5rem 2rem",
          }}>
            {fields.length === 0 ? (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "300px",
                textAlign: "center",
                color: "#94A3B8",
              }}>
                <Plus size={48} style={{ opacity: 0.3, marginBottom: "1rem" }} />
                <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>No fields yet</p>
                <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem" }}>
                  Click a field type above to start building your form
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {fields.map((field, index) => {
                  const config = FIELD_TYPE_CONFIG[field.type];
                  const Icon = config.icon;

                  return (
                    <div
                      key={field.id}
                      style={{
                        padding: "1.5rem",
                        background: "#0F131C",
                        border: "1px solid #1E2636",
                        borderRadius: "12px",
                      }}
                    >
                      {/* Field Header */}
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        marginBottom: "1rem",
                      }}>
                        <GripVertical size={18} style={{ color: "#64748B", cursor: "grab" }} />
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "2rem",
                          height: "2rem",
                          background: "#1E2636",
                          borderRadius: "6px",
                        }}>
                          <Icon size={16} style={{ color: "#38BDF8" }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: 600 }}>
                            {config.label}
                          </div>
                        </div>

                        {/* Move buttons */}
                        <div style={{ display: "flex", gap: "0.25rem" }}>
                          <button
                            onClick={() => moveField(field.id, "up")}
                            disabled={index === 0}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "2rem",
                              height: "2rem",
                              background: "transparent",
                              border: "1px solid #2D3748",
                              borderRadius: "6px",
                              color: index === 0 ? "#64748B" : "#F8FAFC",
                              cursor: index === 0 ? "not-allowed" : "pointer",
                              opacity: index === 0 ? 0.5 : 1,
                            }}
                          >
                            <ChevronUp size={16} />
                          </button>
                          <button
                            onClick={() => moveField(field.id, "down")}
                            disabled={index === fields.length - 1}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "2rem",
                              height: "2rem",
                              background: "transparent",
                              border: "1px solid #2D3748",
                              borderRadius: "6px",
                              color: index === fields.length - 1 ? "#64748B" : "#F8FAFC",
                              cursor: index === fields.length - 1 ? "not-allowed" : "pointer",
                              opacity: index === fields.length - 1 ? 0.5 : 1,
                            }}
                          >
                            <ChevronDown size={16} />
                          </button>
                        </div>

                        <button
                          onClick={() => removeField(field.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "2rem",
                            height: "2rem",
                            background: "transparent",
                            border: "1px solid #DC2626",
                            borderRadius: "6px",
                            color: "#DC2626",
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Field Configuration */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {/* Label */}
                        <div>
                          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#F8FAFC", marginBottom: "0.5rem" }}>
                            Label *
                          </label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                            placeholder="Enter field label..."
                            style={{
                              width: "100%",
                              padding: "0.75rem",
                              background: "#1E2636",
                              border: "1px solid #2D3748",
                              borderRadius: "8px",
                              color: "#F8FAFC",
                              fontSize: "0.875rem",
                              outline: "none",
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = "#38BDF8"}
                            onBlur={(e) => e.currentTarget.style.borderColor = "#2D3748"}
                          />
                        </div>

                        {/* Placeholder */}
                        {!["checkbox", "radio"].includes(field.type) && (
                          <div>
                            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#F8FAFC", marginBottom: "0.5rem" }}>
                              Placeholder
                            </label>
                            <input
                              type="text"
                              value={field.placeholder}
                              onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                              placeholder="Enter placeholder text..."
                              style={{
                                width: "100%",
                                padding: "0.75rem",
                                background: "#1E2636",
                                border: "1px solid #2D3748",
                                borderRadius: "8px",
                                color: "#F8FAFC",
                                fontSize: "0.875rem",
                                outline: "none",
                              }}
                              onFocus={(e) => e.currentTarget.style.borderColor = "#38BDF8"}
                              onBlur={(e) => e.currentTarget.style.borderColor = "#2D3748"}
                            />
                          </div>
                        )}

                        {/* Options (for select, radio, checkbox) */}
                        {config.hasOptions && (
                          <div>
                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: "0.5rem",
                            }}>
                              <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "#F8FAFC" }}>
                                Options
                              </label>
                              <button
                                onClick={() => addOption(field.id)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.375rem",
                                  padding: "0.375rem 0.75rem",
                                  background: "#1E2636",
                                  border: "1px solid #2D3748",
                                  borderRadius: "6px",
                                  color: "#38BDF8",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                <Plus size={14} /> Add Option
                              </button>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                              {field.options.map((option) => (
                                <div key={option.id} style={{ display: "flex", gap: "0.5rem" }}>
                                  <input
                                    type="text"
                                    value={option.label}
                                    onChange={(e) => updateOption(field.id, option.id, e.target.value)}
                                    placeholder="Option label..."
                                    style={{
                                      flex: 1,
                                      padding: "0.625rem",
                                      background: "#1E2636",
                                      border: "1px solid #2D3748",
                                      borderRadius: "6px",
                                      color: "#F8FAFC",
                                      fontSize: "0.875rem",
                                      outline: "none",
                                    }}
                                    onFocus={(e) => e.currentTarget.style.borderColor = "#38BDF8"}
                                    onBlur={(e) => e.currentTarget.style.borderColor = "#2D3748"}
                                  />
                                  {field.options.length > 1 && (
                                    <button
                                      onClick={() => removeOption(field.id, option.id)}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: "2.25rem",
                                        background: "transparent",
                                        border: "1px solid #DC2626",
                                        borderRadius: "6px",
                                        color: "#DC2626",
                                        cursor: "pointer",
                                      }}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Required checkbox */}
                        <label style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.625rem",
                          cursor: "pointer",
                          padding: "0.75rem",
                          background: "#1E2636",
                          borderRadius: "8px",
                        }}>
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(field.id, { required: e.target.checked })}
                            style={{
                              width: "1.125rem",
                              height: "1.125rem",
                              cursor: "pointer",
                            }}
                          />
                          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#F8FAFC" }}>
                            Required field
                          </span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            background: "#0F131C",
          }}>
            <div style={{
              padding: "1.5rem 2rem",
              borderBottom: "1px solid #1E2636",
            }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Form Preview
              </div>
            </div>

            <div style={{
              flex: 1,
              overflowY: "auto",
              padding: "2rem",
            }}>
              <div style={{
                maxWidth: "600px",
                margin: "0 auto",
                padding: "2rem",
                background: "#0A0D12",
                border: "1px solid #1E2636",
                borderRadius: "16px",
              }}>
                <h3 style={{ margin: "0 0 1.5rem", fontSize: "1.5rem", fontWeight: 700, color: "#F8FAFC" }}>
                  Event Registration
                </h3>

                {fields.length === 0 ? (
                  <p style={{ margin: 0, color: "#94A3B8", textAlign: "center", padding: "2rem 0" }}>
                    No fields to preview
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {fields.map((field) => {
                      const config = FIELD_TYPE_CONFIG[field.type];

                      return (
                        <div key={field.id}>
                          <label style={{
                            display: "block",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: "#F8FAFC",
                            marginBottom: "0.5rem",
                          }}>
                            {field.label} {field.required && <span style={{ color: "#DC2626" }}>*</span>}
                          </label>

                          {field.type === "textarea" ? (
                            <textarea
                              placeholder={field.placeholder}
                              rows={4}
                              disabled
                              style={{
                                width: "100%",
                                padding: "0.75rem",
                                background: "#1E2636",
                                border: "1px solid #2D3748",
                                borderRadius: "8px",
                                color: "#F8FAFC",
                                fontSize: "0.875rem",
                                resize: "vertical",
                              }}
                            />
                          ) : field.type === "select" ? (
                            <select
                              disabled
                              style={{
                                width: "100%",
                                padding: "0.75rem",
                                background: "#1E2636",
                                border: "1px solid #2D3748",
                                borderRadius: "8px",
                                color: "#F8FAFC",
                                fontSize: "0.875rem",
                              }}
                            >
                              <option>{field.placeholder}</option>
                              {field.options.map(opt => (
                                <option key={opt.id}>{opt.label}</option>
                              ))}
                            </select>
                          ) : field.type === "radio" ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                              {field.options.map(opt => (
                                <label key={opt.id} style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.625rem",
                                  padding: "0.75rem",
                                  background: "#1E2636",
                                  borderRadius: "8px",
                                  cursor: "pointer",
                                }}>
                                  <input type="radio" name={field.id} disabled style={{ cursor: "pointer" }} />
                                  <span style={{ fontSize: "0.875rem", color: "#F8FAFC" }}>{opt.label}</span>
                                </label>
                              ))}
                            </div>
                          ) : field.type === "checkbox" ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                              {field.options.map(opt => (
                                <label key={opt.id} style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.625rem",
                                  padding: "0.75rem",
                                  background: "#1E2636",
                                  borderRadius: "8px",
                                  cursor: "pointer",
                                }}>
                                  <input type="checkbox" disabled style={{ cursor: "pointer" }} />
                                  <span style={{ fontSize: "0.875rem", color: "#F8FAFC" }}>{opt.label}</span>
                                </label>
                              ))}
                            </div>
                          ) : (
                            <input
                              type={field.type}
                              placeholder={field.placeholder}
                              disabled
                              style={{
                                width: "100%",
                                padding: "0.75rem",
                                background: "#1E2636",
                                border: "1px solid #2D3748",
                                borderRadius: "8px",
                                color: "#F8FAFC",
                                fontSize: "0.875rem",
                              }}
                            />
                          )}
                        </div>
                      );
                    })}

                    <button
                      disabled
                      style={{
                        width: "100%",
                        padding: "1rem",
                        background: "linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)",
                        border: "none",
                        borderRadius: "12px",
                        color: "#0F131C",
                        fontSize: "1rem",
                        fontWeight: 700,
                        marginTop: "1rem",
                        opacity: 0.7,
                        cursor: "not-allowed",
                      }}
                    >
                      Submit Registration
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1.5rem 2rem",
        borderTop: "1px solid #1E2636",
        background: "#0F131C",
      }}>
        <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
          {fields.length} {fields.length === 1 ? "field" : "fields"} configured
        </div>

        <button
          onClick={handleSave}
          disabled={saving || fields.length === 0}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            padding: "0.875rem 1.75rem",
            background: saving || fields.length === 0 ? "#2D3748" : "linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)",
            border: "none",
            borderRadius: "12px",
            color: saving || fields.length === 0 ? "#64748B" : "#0F131C",
            fontSize: "0.9375rem",
            fontWeight: 700,
            cursor: saving || fields.length === 0 ? "not-allowed" : "pointer",
            boxShadow: saving || fields.length === 0 ? "none" : "0 4px 12px rgba(56, 189, 248, 0.25)",
            transition: "all 0.2s",
          }}
        >
          {saving ? (
            <>
              <div style={{
                width: "1rem",
                height: "1rem",
                border: "2px solid #64748B",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }} />
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              Save Form
            </>
          )}
        </button>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
