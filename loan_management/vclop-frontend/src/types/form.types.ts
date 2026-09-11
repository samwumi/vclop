// Matches the backend's FormFieldType enum exactly (prisma/schema.prisma).
export type FieldType =
  | 'TEXT'
  | 'TEXTAREA'
  | 'NUMBER'
  | 'MONEY'
  | 'DATE'
  | 'PHONE'
  | 'EMAIL'
  | 'BVN'
  | 'NIN'
  | 'FILE_UPLOAD'
  | 'PHOTO_UPLOAD'
  | 'CHECKBOX'
  | 'RADIO'
  | 'DROPDOWN'
  | 'MULTI_SELECT'
  | 'SWITCH'
  | 'ADDRESS'
  | 'GPS'
  | 'HIDDEN'
  | 'FORMULA';

export type FormEntityType = 'CUSTOMER' | 'LOAN' | 'BUSINESS' | 'GUARANTOR' | 'COLLATERAL';

export interface FieldOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/** Matches the flat validation object the backend reads: { minLength?, maxLength?, regex? } */
export interface ValidationRules {
  minLength?: number;
  maxLength?: number;
  regex?: string;
}

/** Matches the backend's single visibilityRule JSON object — one condition, not a rule chain. */
export interface VisibilityRule {
  fieldCode: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'is_empty' | 'is_not_empty' | 'in';
  value: unknown;
}

export interface FormField {
  id: string;
  sectionId: string;
  code: string;
  label: string;
  type: FieldType;
  placeholder: string | null;
  helpText: string | null;
  isRequired: boolean;
  defaultValue: unknown;
  options: FieldOption[] | null;
  validation: ValidationRules | null;
  visibilityRule: VisibilityRule | null;
  sortOrder: number;
  isActive: boolean;
}

export interface FormSection {
  id: string;
  formTemplateId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  fields: FormField[];
}

export interface FormTemplate {
  id: string;
  entityType: FormEntityType;
  code: string;
  name: string;
  description: string | null;
  version: number;
  isActive: boolean;
  isDefault: boolean;
  sections: FormSection[];
}
