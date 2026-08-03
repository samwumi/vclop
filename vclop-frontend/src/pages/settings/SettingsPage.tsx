import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Save } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PageLoader } from '@/components/ui/LoadingScreen';
import { useAuthStore } from '@/stores/auth.store';
import type { ApiResponse } from '@/types/api.types';
import type { Setting } from '@/types/domain.types';

type GroupedSettings = Record<string, Setting[]>;

export function SettingsPage() {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const { hasPermission } = useAuthStore();
  const canEdit = hasPermission('settings:update');
  const qc = useQueryClient();

  const { data: groups, isLoading } = useQuery({
    queryKey: ['settings', 'grouped'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<GroupedSettings>>('/settings');
      return data.data!;
    },
  });

  const groupNames = Object.keys(groups ?? {});
  const currentGroup = activeGroup ?? groupNames[0] ?? '';
  const settings = groups?.[currentGroup] ?? [];

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = Object.entries(edits).map(([key, value]) => ({ key, value }));
      await api.patch('/settings/bulk', { settings: payload });
    },
    onSuccess: () => {
      toast.success('Settings saved');
      setEdits({});
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: () => toast.error('Failed to save settings'),
  });

  return (
    <div>
      <Breadcrumbs />
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-600" />
          Settings
        </h1>
        {canEdit && Object.keys(edits).length > 0 && (
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="btn-primary btn-sm gap-2"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? 'Saving…' : `Save ${Object.keys(edits).length} change(s)`}
          </button>
        )}
      </div>

      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Group sidebar */}
          <nav className="md:w-44 md:flex-shrink-0">
            <div className="card overflow-hidden flex md:flex-col flex-row flex-wrap">
              {groupNames.map((group) => (
                <button
                  key={group}
                  onClick={() => setActiveGroup(group)}
                  className={`text-left px-4 py-2.5 text-sm capitalize border-b border-gray-100 last:border-0 transition-colors whitespace-nowrap
                    ${group === currentGroup ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {group.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </nav>

          {/* Settings form */}
          <div className="flex-1 card">
            <div className="card-header">
              <h2 className="text-sm font-semibold text-gray-800 capitalize">
                {currentGroup.replace(/_/g, ' ')} Settings
              </h2>
            </div>
            <div className="card-body divide-y divide-gray-100">
              {settings.map((setting) => (
                <div key={setting.id} className="py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{setting.label}</p>
                    {setting.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{setting.description}</p>
                    )}
                    <code className="text-xs text-gray-400 mt-0.5 block">{setting.key}</code>
                  </div>
                  <div>
                    {setting.type === 'BOOLEAN' ? (
                      <select
                        disabled={setting.isReadonly || !canEdit}
                        value={edits[setting.key] ?? setting.value ?? setting.defaultValue ?? 'false'}
                        onChange={(e) => setEdits((p) => ({ ...p, [setting.key]: e.target.value }))}
                        className="form-input text-sm"
                      >
                        <option value="true">Enabled</option>
                        <option value="false">Disabled</option>
                      </select>
                    ) : setting.type === 'TEXTAREA' ? (
                      <textarea
                        rows={3}
                        disabled={setting.isReadonly || !canEdit}
                        value={edits[setting.key] ?? setting.value ?? setting.defaultValue ?? ''}
                        onChange={(e) => setEdits((p) => ({ ...p, [setting.key]: e.target.value }))}
                        className="form-input text-sm resize-none"
                      />
                    ) : (
                      <input
                        type={setting.type === 'NUMBER' ? 'number' : setting.type === 'EMAIL' ? 'email' : 'text'}
                        disabled={setting.isReadonly || !canEdit}
                        value={edits[setting.key] ?? setting.value ?? setting.defaultValue ?? ''}
                        onChange={(e) => setEdits((p) => ({ ...p, [setting.key]: e.target.value }))}
                        className="form-input text-sm"
                      />
                    )}
                    {setting.isReadonly && (
                      <p className="form-hint">Read-only system setting</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
