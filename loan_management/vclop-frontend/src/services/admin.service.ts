import { api } from '@/lib/axios';
import type { PaginationParams } from '@/types/api.types';

export const adminService = {
  // ── Customer Types ──────────────────────────────────────────────────────────
  customerTypes: {
    async list(params?: PaginationParams) {
      const p = new URLSearchParams();
      if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined) p.set(k, String(v)); });
      const { data } = await api.get(`/admin/customer-types?${p}`);
      return data.data;
    },
    async create(payload: unknown) { return (await api.post('/admin/customer-types', payload)).data.data; },
    async update(id: string, payload: unknown) { return (await api.patch(`/admin/customer-types/${id}`, payload)).data.data; },
    async remove(id: string) { await api.delete(`/admin/customer-types/${id}`); },
  },

  // ── Document Types ──────────────────────────────────────────────────────────
  documentTypes: {
    async list(params?: PaginationParams) {
      const p = new URLSearchParams();
      if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined) p.set(k, String(v)); });
      const { data } = await api.get(`/admin/document-types?${p}`);
      return data.data;
    },
    async get(id: string) { return (await api.get(`/admin/document-types/${id}`)).data.data; },
    async create(payload: unknown) { return (await api.post('/admin/document-types', payload)).data.data; },
    async update(id: string, payload: unknown) { return (await api.patch(`/admin/document-types/${id}`, payload)).data.data; },
    async remove(id: string) { await api.delete(`/admin/document-types/${id}`); },
  },

  // ── Loan Products ───────────────────────────────────────────────────────────
  loanProducts: {
    async list(params?: PaginationParams & { isActive?: boolean }) {
      const p = new URLSearchParams();
      if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined) p.set(k, String(v)); });
      const { data } = await api.get(`/loan-products?${p}`);
      // Backend's TransformInterceptor lifts pagination meta to the top level — data.data is the flat array.
      return (data.data ?? []) as unknown[];
    },
    async get(id: string) { return (await api.get(`/loan-products/${id}`)).data.data; },
    async create(payload: unknown) { return (await api.post('/loan-products', payload)).data.data; },
    async update(id: string, payload: unknown) { return (await api.patch(`/loan-products/${id}`, payload)).data.data; },
    async remove(id: string) { await api.delete(`/loan-products/${id}`); },
  },

  // ── Workflows ───────────────────────────────────────────────────────────────
  workflows: {
    async list(params?: PaginationParams) {
      const p = new URLSearchParams();
      if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined) p.set(k, String(v)); });
      const { data } = await api.get(`/admin/workflows?${p}`);
      return data.data;
    },
    async get(id: string) { return (await api.get(`/admin/workflows/${id}`)).data.data; },
    async create(payload: unknown) { return (await api.post('/admin/workflows', payload)).data.data; },
    async update(id: string, payload: unknown) { return (await api.patch(`/admin/workflows/${id}`, payload)).data.data; },
    async remove(id: string) { await api.delete(`/admin/workflows/${id}`); },
    async createStage(workflowId: string, payload: unknown) { return (await api.post(`/admin/workflows/${workflowId}/stages`, payload)).data.data; },
    async updateStage(stageId: string, payload: unknown) { return (await api.patch(`/admin/workflows/stages/${stageId}`, payload)).data.data; },
    async deleteStage(stageId: string) { await api.delete(`/admin/workflows/stages/${stageId}`); },
    async reorderStages(stages: { id: string; sortOrder: number }[]) {
      await api.post('/admin/workflows/stages/reorder', { stages });
    },
  },

  // ── Business Rules ──────────────────────────────────────────────────────────
  rules: {
    async list(params?: PaginationParams & { category?: string }) {
      const p = new URLSearchParams();
      if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined) p.set(k, String(v)); });
      const { data } = await api.get(`/admin/rules?${p}`);
      return data.data;
    },
    async get(id: string) { return (await api.get(`/admin/rules/${id}`)).data.data; },
    async create(payload: unknown) { return (await api.post('/admin/rules', payload)).data.data; },
    async update(id: string, payload: unknown) { return (await api.patch(`/admin/rules/${id}`, payload)).data.data; },
    async remove(id: string) { await api.delete(`/admin/rules/${id}`); },
    async test(id: string, context: Record<string, unknown>) {
      return (await api.post(`/admin/rules/${id}/test`, context)).data.data;
    },
    async getCategories(): Promise<string[]> { return (await api.get('/admin/rules/categories')).data.data; },
  },

  // ── Formulas ────────────────────────────────────────────────────────────────
  formulas: {
    async list(params?: PaginationParams & { category?: string }) {
      const p = new URLSearchParams();
      if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined) p.set(k, String(v)); });
      const { data } = await api.get(`/admin/formulas?${p}`);
      return data.data;
    },
    async get(id: string) { return (await api.get(`/admin/formulas/${id}`)).data.data; },
    async create(payload: unknown) { return (await api.post('/admin/formulas', payload)).data.data; },
    async update(id: string, payload: unknown) { return (await api.patch(`/admin/formulas/${id}`, payload)).data.data; },
    async remove(id: string) { await api.delete(`/admin/formulas/${id}`); },
    async evaluate(id: string, variables: Record<string, number>) {
      return (await api.post(`/admin/formulas/${id}/evaluate`, { variables })).data.data;
    },
  },

  // ── Form Engine ─────────────────────────────────────────────────────────────
  forms: {
    async listTemplates(entityType?: string) {
      const p = new URLSearchParams();
      if (entityType) p.set('entityType', entityType);
      const { data } = await api.get(`/forms/templates?${p}`);
      // Backend's TransformInterceptor lifts pagination meta to the top level — data.data is the flat array.
      return (data.data ?? []) as unknown[];
    },
    async getTemplate(id: string) {
      return (await api.get(`/forms/templates/${id}`)).data.data;
    },
    async getDefaultTemplate(entityType: string) {
      return (await api.get(`/forms/templates/default/${entityType}`)).data.data;
    },
    async createTemplate(payload: unknown) { return (await api.post('/forms/templates', payload)).data.data; },
    async updateTemplate(id: string, payload: unknown) { return (await api.patch(`/forms/templates/${id}`, payload)).data.data; },
    async cloneTemplate(id: string, code: string) { return (await api.post(`/forms/templates/${id}/clone`, { code })).data.data; },
    async deleteTemplate(id: string) { await api.delete(`/forms/templates/${id}`); },

    async addSection(templateId: string, payload: unknown) { return (await api.post(`/forms/templates/${templateId}/sections`, payload)).data.data; },
    async updateSection(templateId: string, sectionId: string, payload: unknown) {
      return (await api.patch(`/forms/templates/${templateId}/sections/${sectionId}`, payload)).data.data;
    },
    async removeSection(templateId: string, sectionId: string) {
      return (await api.delete(`/forms/templates/${templateId}/sections/${sectionId}`)).data.data;
    },
    async reorderSections(templateId: string, sections: { id: string; sortOrder: number }[]) {
      return (await api.patch(`/forms/templates/${templateId}/sections/reorder`, { sections })).data.data;
    },

    async addField(templateId: string, sectionId: string, payload: unknown) {
      return (await api.post(`/forms/templates/${templateId}/sections/${sectionId}/fields`, payload)).data.data;
    },
    async updateField(templateId: string, fieldId: string, payload: unknown) {
      return (await api.patch(`/forms/templates/${templateId}/fields/${fieldId}`, payload)).data.data;
    },
    async removeField(templateId: string, fieldId: string) {
      return (await api.delete(`/forms/templates/${templateId}/fields/${fieldId}`)).data.data;
    },
    async moveFields(templateId: string, fields: { id: string; sectionId?: string; sortOrder: number }[]) {
      return (await api.patch(`/forms/templates/${templateId}/fields/move`, { fields })).data.data;
    },

    // ── Submissions ────────────────────────────────────────────────────────
    async submit(formTemplateId: string, entityType: string, entityId: string, values: { fieldId: string; value: unknown }[]) {
      return (await api.post('/forms/submissions', { formTemplateId, entityType, entityId, values })).data.data;
    },
    async getSubmission(formTemplateId: string, entityType: string, entityId: string) {
      return (await api.get(`/forms/submissions/${formTemplateId}/${entityType}/${entityId}`)).data.data;
    },
  },

  // ── Approval Matrix ─────────────────────────────────────────────────────────
  approvalMatrix: {
    async list() { return (await api.get('/admin/approval-matrix')).data.data; },
    async get(id: string) { return (await api.get(`/admin/approval-matrix/${id}`)).data.data; },
    async create(payload: unknown) { return (await api.post('/admin/approval-matrix', payload)).data.data; },
    async update(id: string, payload: unknown) { return (await api.patch(`/admin/approval-matrix/${id}`, payload)).data.data; },
    async remove(id: string) { await api.delete(`/admin/approval-matrix/${id}`); },
  },
};
