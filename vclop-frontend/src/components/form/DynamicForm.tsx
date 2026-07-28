import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import type { FieldOption, FormField, FormSection } from '@/types/form.types';

interface DynamicFormProps {
  sections: FormSection[];
  values?: Record<string, unknown>;
  onChange?: (values: Record<string, unknown>) => void;
  onSubmit?: (values: Record<string, unknown>) => void;
  className?: string;
  submitLabel?: string;
  hideSubmit?: boolean;
  disabled?: boolean;
}

interface FieldError {
  [fieldCode: string]: string;
}

const DEFAULT_VALUE_MAP: Record<string, unknown> = {
  CHECKBOX: false,
  SWITCH: false,
  MULTI_SELECT: [],
};

function normalizeValue(field: FormField, value: unknown): unknown {
  if (value === undefined || value === null || value === '') {
    return field.defaultValue ?? DEFAULT_VALUE_MAP[field.type] ?? '';
  }
  return value;
}

function getInitialValues(sections: FormSection[], values?: Record<string, unknown>) {
  const initial: Record<string, unknown> = { ...(values ?? {}) };
  for (const section of sections) {
    for (const field of section.fields) {
      if (initial[field.code] === undefined) {
        initial[field.code] = normalizeValue(field, field.defaultValue ?? '');
      }
    }
  }
  return initial;
}

function isEmpty(value: unknown) {
  return value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
}

function matchesCondition(value: unknown, operator: string, expected: unknown) {
  switch (operator) {
    case 'equals': return value === expected;
    case 'not_equals': return value !== expected;
    case 'contains': return typeof value === 'string' && typeof expected === 'string' && value.includes(expected);
    case 'is_empty': return isEmpty(value);
    case 'is_not_empty': return !isEmpty(value);
    case 'in': return Array.isArray(expected) && (expected as unknown[]).includes(value);
    default: return false;
  }
}

/** The backend stores one visibilityRule object per field, not a rule chain — a field is either always visible or conditionally visible on a single watched field. */
function isFieldVisible(field: FormField, values: Record<string, unknown>): boolean {
  if (field.type === 'HIDDEN') return false;
  if (!field.visibilityRule) return true;
  const { fieldCode, operator, value: expected } = field.visibilityRule;
  return matchesCondition(values[fieldCode], operator, expected);
}

function validateField(field: FormField, value: unknown, required: boolean): string | null {
  if (required && isEmpty(value)) {
    return `${field.label} is required`;
  }
  if (isEmpty(value)) return null;

  const rules = field.validation;
  if (rules?.minLength !== undefined && String(value).length < rules.minLength) {
    return `${field.label} must be at least ${rules.minLength} characters`;
  }
  if (rules?.maxLength !== undefined && String(value).length > rules.maxLength) {
    return `${field.label} must be at most ${rules.maxLength} characters`;
  }
  if (rules?.regex && !new RegExp(rules.regex).test(String(value))) {
    return `${field.label} is not in the expected format`;
  }
  if (field.type === 'BVN' || field.type === 'NIN') {
    if (!/^\d{11}$/.test(String(value))) return `${field.label} must be 11 digits`;
  }
  if (field.type === 'EMAIL' && !/^\S+@\S+\.\S+$/.test(String(value))) {
    return `${field.label} must be a valid email`;
  }
  return null;
}

function renderOptions(options: FieldOption[] | null | undefined) {
  return options?.map((option) => (
    <option key={option.value} value={option.value} disabled={option.disabled}> {option.label} </option>
  ));
}

export function DynamicForm(props: DynamicFormProps) {
  const { sections, values, onChange, onSubmit, className, hideSubmit, submitLabel = 'Submit', disabled } = props;
  const [formData, setFormData] = useState<Record<string, unknown>>(() => getInitialValues(sections, values));
  const [errors, setErrors] = useState<FieldError>({});

  useEffect(() => {
    setFormData(getInitialValues(sections, values));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  const flatFields = useMemo(() => sections.flatMap((section) => section.fields.filter((f) => f.isActive)), [sections]);

  const handleFieldChange = (field: FormField, rawValue: unknown) => {
    const value = normalizeFieldValue(field, rawValue);
    const next = { ...formData, [field.code]: value };
    setFormData(next);
    onChange?.(next);
  };

  const normalizeFieldValue = (field: FormField, rawValue: unknown) => {
    if (field.type === 'NUMBER' || field.type === 'MONEY') {
      return rawValue === '' ? '' : Number(rawValue);
    }
    if (field.type === 'CHECKBOX' || field.type === 'SWITCH') {
      return Boolean(rawValue);
    }
    if (field.type === 'MULTI_SELECT') {
      return Array.isArray(rawValue) ? rawValue : String(rawValue).split(',').filter(Boolean);
    }
    return rawValue;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: FieldError = {};
    const visibleFields = flatFields.filter((field) => isFieldVisible(field, formData));
    for (const field of visibleFields) {
      const error = validateField(field, formData[field.code], field.isRequired);
      if (error) nextErrors[field.code] = error;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      onSubmit?.(formData);
    }
  };

  const renderField = (field: FormField) => {
    if (!isFieldVisible(field, formData)) return null;

    const value = formData[field.code];
    const error = errors[field.code];
    const label = field.label + (field.isRequired ? ' *' : '');
    const helper = field.helpText ?? field.placeholder ?? '';
    const isFileType = field.type === 'FILE_UPLOAD' || field.type === 'PHOTO_UPLOAD';
    const commonProps = {
      id: field.code,
      value: isFileType || field.type === 'CHECKBOX' || field.type === 'SWITCH' ? undefined : (value as string | number | undefined),
      disabled,
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (field.type === 'CHECKBOX' || field.type === 'SWITCH') {
          handleFieldChange(field, (event.target as HTMLInputElement).checked);
        } else if (field.type === 'MULTI_SELECT') {
          const options = Array.from((event.target as HTMLSelectElement).selectedOptions);
          handleFieldChange(field, options.map((o) => o.value));
        } else if (isFileType) {
          handleFieldChange(field, (event.target as HTMLInputElement).files?.[0] ?? null);
        } else {
          handleFieldChange(field, event.target.value);
        }
      },
      className: `form-input ${error ? 'border-red-500' : ''}`,
      placeholder: field.placeholder ?? '',
    };

    return (
      <div key={field.id} className="space-y-2">
        <label htmlFor={field.code} className="text-sm font-medium text-gray-700">{label}</label>
        {renderInput(field, commonProps, value)}
        {helper && <p className="text-xs text-gray-500">{helper}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  };

  const renderInput = (field: FormField, commonProps: Record<string, unknown>, value: unknown) => {
    switch (field.type) {
      case 'TEXT':
      case 'EMAIL':
      case 'PHONE':
      case 'BVN':
      case 'NIN':
      case 'NUMBER':
      case 'MONEY':
        return <input type={field.type === 'NUMBER' || field.type === 'MONEY' ? 'number' : field.type === 'EMAIL' ? 'email' : field.type === 'PHONE' ? 'tel' : 'text'} {...commonProps} />;
      case 'TEXTAREA':
      case 'ADDRESS':
        return <textarea rows={field.type === 'ADDRESS' ? 3 : 4} {...commonProps} />;
      case 'DATE':
        return <input type="date" {...commonProps} />;
      case 'CHECKBOX':
      case 'SWITCH':
        return (
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={Boolean(value)} {...commonProps} />
            <span className="text-sm text-gray-600">{field.helpText}</span>
          </div>
        );
      case 'RADIO':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name={field.code}
                  value={option.value}
                  checked={value === option.value}
                  disabled={disabled || option.disabled}
                  onChange={() => handleFieldChange(field, option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        );
      case 'DROPDOWN':
        return (
          <select {...commonProps}>
            <option value="">Select an option</option>
            {renderOptions(field.options)}
          </select>
        );
      case 'MULTI_SELECT':
        return (
          <select multiple {...commonProps} value={(value ?? []) as string[]}>
            {renderOptions(field.options)}
          </select>
        );
      case 'FILE_UPLOAD':
        return <input type="file" {...commonProps} />;
      case 'PHOTO_UPLOAD':
        return <input type="file" accept="image/*" {...commonProps} />;
      case 'GPS':
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            <input type="text" value={String((value as { lat?: number } | undefined)?.lat ?? '')} disabled className="form-input" placeholder="Latitude" readOnly />
            <input type="text" value={String((value as { lng?: number } | undefined)?.lng ?? '')} disabled className="form-input" placeholder="Longitude" readOnly />
            <button type="button" disabled={disabled} className="btn-secondary" onClick={() => captureLocation(field)}>
              Capture Location
            </button>
          </div>
        );
      case 'HIDDEN':
        return <input type="hidden" value={value as string ?? ''} readOnly />;
      case 'FORMULA':
        return <input type="text" value={value as string ?? ''} disabled className="form-input bg-gray-50" placeholder="Calculated automatically" />;
      default:
        return <input type="text" {...commonProps} />;
    }
  };

  const captureLocation = (field: FormField) => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      handleFieldChange(field, { lat: position.coords.latitude, lng: position.coords.longitude });
    });
  };

  return (
    <form className={className} onSubmit={handleSubmit}>
      <div className="space-y-6">
        {sections.filter((s) => s.isActive).map((section) => (
          <div key={section.id} className="card">
            <div className="card-header">
              <h2 className="text-sm font-semibold text-gray-700">{section.title}</h2>
              {section.description && <p className="text-xs text-gray-500 mt-1">{section.description}</p>}
            </div>
            <div className="card-body grid gap-4 sm:grid-cols-2">
              {section.fields.filter((f) => f.isActive).map(renderField)}
            </div>
          </div>
        ))}
      </div>
      {!hideSubmit && (
        <div className="mt-6 text-right">
          <button type="submit" disabled={disabled} className="btn-primary">
            {submitLabel}
          </button>
        </div>
      )}
    </form>
  );
}
