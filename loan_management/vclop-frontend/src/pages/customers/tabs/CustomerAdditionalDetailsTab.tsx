import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminService } from '@/services/admin.service';
import { DynamicForm } from '@/components/form/DynamicForm';
import { PageLoader } from '@/components/ui/LoadingScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import { FileText } from 'lucide-react';
import type { FormTemplate, FormField } from '@/types/form.types';

/**
 * Uses the same Form Engine that powers the admin configuration screen —
 * whatever an admin adds/removes there for the CUSTOMER entity type shows up
 * here automatically, with no code change.
 */
export function CustomerAdditionalDetailsTab({
  customerId, existingValues,
}: { customerId: string; existingValues: Record<string, unknown> | null }) {
  const qc = useQueryClient();

  const { data: template, isLoading } = useQuery({
    queryKey: ['forms', 'default', 'CUSTOMER'],
    queryFn: () => adminService.forms.getDefaultTemplate('CUSTOMER') as Promise<FormTemplate>,
    retry: false,
  });

  const submitMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => {
      const fieldsByCode = new Map<string, FormField>(
        (template?.sections ?? []).flatMap((s) => s.fields.map((f) => [f.code, f] as const)),
      );
      const payload = Object.entries(values)
        .filter(([code]) => fieldsByCode.has(code))
        .map(([code, value]) => ({ fieldId: fieldsByCode.get(code)!.id, value }));
      return adminService.forms.submit(template!.id, 'CUSTOMER', customerId, payload);
    },
    onSuccess: () => {
      toast.success('Additional details saved');
      qc.invalidateQueries({ queryKey: ['customer360', customerId] });
    },
    onError: () => toast.error('Failed to save — check required fields'),
  });

  if (isLoading) return <PageLoader />;

  if (!template) {
    return (
      <div className="card">
        <EmptyState icon={FileText} title="No form configured" description="An admin hasn't configured a Customer form template yet." />
      </div>
    );
  }

  return (
    <DynamicForm
      sections={template.sections}
      values={existingValues ?? undefined}
      onSubmit={(values) => submitMutation.mutate(values)}
      submitLabel={submitMutation.isPending ? 'Saving…' : 'Save Additional Details'}
      disabled={submitMutation.isPending}
    />
  );
}
