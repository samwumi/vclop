import { useMemo, useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '@/services/admin.service';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PageLoader } from '@/components/ui/LoadingScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import type { FieldType, FormSection, FormField, FormTemplate, FormEntityType } from '@/types/form.types';

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'TEXT', label: 'Text' },
  { value: 'TEXTAREA', label: 'Textarea' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'MONEY', label: 'Money' },
  { value: 'DATE', label: 'Date' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'BVN', label: 'BVN' },
  { value: 'NIN', label: 'NIN' },
  { value: 'CHECKBOX', label: 'Checkbox' },
  { value: 'SWITCH', label: 'Switch' },
  { value: 'RADIO', label: 'Radio' },
  { value: 'DROPDOWN', label: 'Dropdown' },
  { value: 'MULTI_SELECT', label: 'Multi Select' },
  { value: 'FILE_UPLOAD', label: 'File Upload' },
  { value: 'PHOTO_UPLOAD', label: 'Photo Upload' },
  { value: 'ADDRESS', label: 'Address' },
  { value: 'GPS', label: 'GPS' },
  { value: 'HIDDEN', label: 'Hidden' },
  { value: 'FORMULA', label: 'Formula' },
];

const ENTITY_TYPES: FormEntityType[] = ['CUSTOMER', 'LOAN', 'BUSINESS', 'GUARANTOR', 'COLLATERAL'];

export function FormEngineAdminPage() {
  const qc = useQueryClient();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [templateForm, setTemplateForm] = useState({ name: '', code: '', description: '', entityType: 'CUSTOMER' as FormEntityType });
  const [sectionForm, setSectionForm] = useState({ title: '', description: '', sortOrder: '0' });
  const [fieldForm, setFieldForm] = useState({ label: '', code: '', type: 'TEXT' as FieldType, placeholder: '', helpText: '', isRequired: false, sortOrder: '0', options: '' });

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['admin', 'forms', 'templates'],
    queryFn: () => adminService.forms.listTemplates() as Promise<FormTemplate[]>,
  });

  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ['admin', 'forms', 'template', selectedTemplateId],
    queryFn: () => adminService.forms.getTemplate(selectedTemplateId!) as Promise<FormTemplate>,
    enabled: !!selectedTemplateId,
  });

  const templateMutation = useMutation({
    mutationFn: (payload: unknown) => adminService.forms.createTemplate(payload),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['admin', 'forms', 'templates'] });
      setTemplateForm({ name: '', code: '', description: '', entityType: 'CUSTOMER' });
      setSelectedTemplateId((created as FormTemplate).id);
      toast.success('Form template created');
    },
    onError: () => toast.error('Failed to create template — check the code is unique'),
  });

  const sectionMutation = useMutation({
    mutationFn: (payload: unknown) => adminService.forms.addSection(selectedTemplateId!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'forms', 'template', selectedTemplateId] });
      setSectionForm({ title: '', description: '', sortOrder: '0' });
      toast.success('Section added');
    },
    onError: () => toast.error('Failed to add section'),
  });

  const removeSectionMutation = useMutation({
    mutationFn: (sectionId: string) => adminService.forms.removeSection(selectedTemplateId!, sectionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'forms', 'template', selectedTemplateId] });
      setSelectedSectionId(null);
      toast.success('Section removed');
    },
    onError: () => toast.error('Failed to remove section'),
  });

  const fieldMutation = useMutation({
    mutationFn: (payload: unknown) => adminService.forms.addField(selectedTemplateId!, selectedSectionId!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'forms', 'template', selectedTemplateId] });
      setFieldForm({ label: '', code: '', type: 'TEXT', placeholder: '', helpText: '', isRequired: false, sortOrder: '0', options: '' });
      toast.success('Field added');
    },
    onError: () => toast.error('Failed to add field — check the code is unique within this section'),
  });

  const removeFieldMutation = useMutation({
    mutationFn: (fieldId: string) => adminService.forms.removeField(selectedTemplateId!, fieldId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'forms', 'template', selectedTemplateId] });
      toast.success('Field removed');
    },
    onError: () => toast.error('Failed to remove field'),
  });

  const selectedSection = useMemo(
    () => template?.sections.find((s: FormSection) => s.id === selectedSectionId),
    [template, selectedSectionId],
  );

  const handleTemplateSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    templateMutation.mutate({
      name: templateForm.name,
      code: templateForm.code,
      description: templateForm.description || undefined,
      entityType: templateForm.entityType,
    });
  };

  const handleSectionSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sectionMutation.mutate({
      title: sectionForm.title,
      description: sectionForm.description || undefined,
      sortOrder: Number(sectionForm.sortOrder || 0),
    });
  };

  const handleFieldSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSectionId) return;
    const options = fieldForm.options
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [value, label] = line.split('|').map((part) => part.trim());
        return { value, label: label || value };
      });

    fieldMutation.mutate({
      label: fieldForm.label,
      code: fieldForm.code,
      type: fieldForm.type,
      placeholder: fieldForm.placeholder || undefined,
      helpText: fieldForm.helpText || undefined,
      isRequired: fieldForm.isRequired,
      sortOrder: Number(fieldForm.sortOrder || 0),
      options: options.length ? options : undefined,
    });
  };

  if (templatesLoading) return <PageLoader />;

  return (
    <div>
      <Breadcrumbs />
      <div className="page-header">
        <h1 className="page-title">Form Engine</h1>
        <p className="page-description">Configure customer, loan, guarantor and collateral forms centrally — no code changes needed.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        {/* Templates */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header"><h2 className="text-sm font-semibold text-gray-700">Create template</h2></div>
            <div className="card-body">
              <form onSubmit={handleTemplateSubmit} className="space-y-4">
                <div>
                  <label className="form-label">Entity type</label>
                  <select className="form-input" value={templateForm.entityType} onChange={(e) => setTemplateForm((f) => ({ ...f, entityType: e.target.value as FormEntityType }))}>
                    {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Name</label>
                  <input className="form-input" value={templateForm.name} onChange={(e) => setTemplateForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Code (unique)</label>
                  <input className="form-input" value={templateForm.code} onChange={(e) => setTemplateForm((f) => ({ ...f, code: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Description</label>
                  <textarea rows={2} className="form-input" value={templateForm.description} onChange={(e) => setTemplateForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
                <button type="submit" className="btn-primary gap-2"><Plus className="w-4 h-4" /> Create template</button>
              </form>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h2 className="text-sm font-semibold text-gray-700">Templates</h2></div>
            <div className="card-body space-y-2">
              {!templates?.length ? (
                <EmptyState title="No templates yet" description="Create a form template to begin." />
              ) : (
                templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`w-full rounded-xl border p-3 text-left transition ${selectedTemplateId === t.id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                    onClick={() => { setSelectedTemplateId(t.id); setSelectedSectionId(null); }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-800">{t.name}{t.isDefault && <span className="ml-2 text-xs text-brand-600">(default)</span>}</p>
                        <p className="text-xs text-gray-500">{t.code} · {t.entityType}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sections + Fields */}
        <div className="space-y-6">
          {!selectedTemplateId ? (
            <div className="card"><div className="card-body"><EmptyState title="Select a template" description="Choose a template to manage its sections and fields." /></div></div>
          ) : templateLoading || !template ? (
            <PageLoader />
          ) : (
            <>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="card">
                  <div className="card-header"><h2 className="text-sm font-semibold text-gray-700">Add section</h2></div>
                  <div className="card-body">
                    <form onSubmit={handleSectionSubmit} className="space-y-4">
                      <div>
                        <label className="form-label">Title</label>
                        <input className="form-input" value={sectionForm.title} onChange={(e) => setSectionForm((f) => ({ ...f, title: e.target.value }))} />
                      </div>
                      <div>
                        <label className="form-label">Description</label>
                        <textarea rows={2} className="form-input" value={sectionForm.description} onChange={(e) => setSectionForm((f) => ({ ...f, description: e.target.value }))} />
                      </div>
                      <div>
                        <label className="form-label">Sort order</label>
                        <input type="number" className="form-input" value={sectionForm.sortOrder} onChange={(e) => setSectionForm((f) => ({ ...f, sortOrder: e.target.value }))} />
                      </div>
                      <button type="submit" className="btn-primary gap-2"><Plus className="w-4 h-4" /> Add section</button>
                    </form>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header"><h2 className="text-sm font-semibold text-gray-700">Sections in "{template.name}"</h2></div>
                  <div className="card-body space-y-2">
                    {!template.sections.length ? (
                      <EmptyState title="No sections yet" description="Add a section to start adding fields." />
                    ) : (
                      template.sections.map((section) => (
                        <div
                          key={section.id}
                          className={`flex items-center justify-between gap-3 rounded-xl border p-3 cursor-pointer ${selectedSectionId === section.id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                          onClick={() => setSelectedSectionId(section.id)}
                        >
                          <div>
                            <p className="font-medium text-gray-800">{section.title}</p>
                            <p className="text-xs text-gray-500">{section.fields.length} field(s)</p>
                          </div>
                          <button type="button" className="btn-ghost btn-icon" onClick={(e) => { e.stopPropagation(); removeSectionMutation.mutate(section.id); }}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {selectedSectionId && selectedSection && (
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="card">
                    <div className="card-header"><h2 className="text-sm font-semibold text-gray-700">Add field to "{selectedSection.title}"</h2></div>
                    <div className="card-body">
                      <form onSubmit={handleFieldSubmit} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="form-label">Label</label>
                            <input className="form-input" value={fieldForm.label} onChange={(e) => setFieldForm((f) => ({ ...f, label: e.target.value }))} />
                          </div>
                          <div>
                            <label className="form-label">Code</label>
                            <input className="form-input" value={fieldForm.code} onChange={(e) => setFieldForm((f) => ({ ...f, code: e.target.value }))} placeholder="snake_case" />
                          </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="form-label">Type</label>
                            <select className="form-input" value={fieldForm.type} onChange={(e) => setFieldForm((f) => ({ ...f, type: e.target.value as FieldType }))}>
                              {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="form-label">Sort order</label>
                            <input type="number" className="form-input" value={fieldForm.sortOrder} onChange={(e) => setFieldForm((f) => ({ ...f, sortOrder: e.target.value }))} />
                          </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="form-label">Placeholder</label>
                            <input className="form-input" value={fieldForm.placeholder} onChange={(e) => setFieldForm((f) => ({ ...f, placeholder: e.target.value }))} />
                          </div>
                          <div>
                            <label className="form-label">Help text</label>
                            <input className="form-input" value={fieldForm.helpText} onChange={(e) => setFieldForm((f) => ({ ...f, helpText: e.target.value }))} />
                          </div>
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input type="checkbox" checked={fieldForm.isRequired} onChange={(e) => setFieldForm((f) => ({ ...f, isRequired: e.target.checked }))} />
                          Required
                        </label>
                        {(fieldForm.type === 'RADIO' || fieldForm.type === 'DROPDOWN' || fieldForm.type === 'MULTI_SELECT') && (
                          <div>
                            <label className="form-label">Options (one per line: value | label)</label>
                            <textarea rows={4} className="form-input" value={fieldForm.options} onChange={(e) => setFieldForm((f) => ({ ...f, options: e.target.value }))} />
                          </div>
                        )}
                        <button type="submit" className="btn-primary gap-2"><Plus className="w-4 h-4" /> Add field</button>
                      </form>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header"><h2 className="text-sm font-semibold text-gray-700">Fields</h2></div>
                    <div className="card-body space-y-3">
                      {!selectedSection.fields.length ? (
                        <EmptyState title="No fields" description="Add fields using the form on the left." />
                      ) : (
                        selectedSection.fields.map((field: FormField) => (
                          <div key={field.id} className="flex flex-col gap-2 rounded-xl border border-gray-200 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-medium text-gray-800">{field.label}{field.isRequired && <span className="text-red-500"> *</span>}</p>
                                <p className="text-xs text-gray-500">{field.code} · {field.type}</p>
                              </div>
                              <button type="button" className="btn-ghost btn-icon" onClick={() => removeFieldMutation.mutate(field.id)}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                            {field.helpText && <p className="text-xs text-gray-500">{field.helpText}</p>}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
