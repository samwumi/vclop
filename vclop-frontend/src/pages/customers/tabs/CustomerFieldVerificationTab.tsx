import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  MapPin, Clock, Camera, Navigation, CheckCircle2, ShieldCheck, AlertTriangle,
} from 'lucide-react';
import { complianceService } from '@/services/compliance.service';
import { loansService } from '@/services/loans.service';
import { formatDateTime } from '@/lib/utils';
import type { FieldVisit } from '@/services/compliance.service';

const VISIT_TYPES = ['BUSINESS', 'RESIDENCE', 'EMPLOYER', 'GUARANTOR', 'OTHER'];

interface Props {
  customerId: string;
  /** true for compliance officers who can log visits; false for IC (read-only) */
  canLog: boolean;
}

export function CustomerFieldVerificationTab({ customerId, canLog }: Props) {
  const qc = useQueryClient();

  const [form, setForm] = useState({
    visitType: 'BUSINESS',
    latitude: '',
    longitude: '',
    arrivedAt: '',
    completedAt: '',
    findings: '',
    photos: [] as string[],
  });

  // Check if customer has any loan application (needed to anchor field visits)
  const { data: loansData } = useQuery({
    queryKey: ['customer-loans-check', customerId],
    queryFn: () => loansService.list({ customerId, limit: 1, page: 1 }),
  });
  const hasLoanApp = (loansData?.data?.length ?? 0) > 0;

  const { data: visits = [], isLoading } = useQuery({
    queryKey: ['customer-field-visits', customerId],
    queryFn: () => complianceService.getCustomerFieldVisits(customerId),
  });

  const logMutation = useMutation({
    mutationFn: () =>
      complianceService.addCustomerFieldVisit(customerId, {
        visitType: form.visitType,
        latitude:  form.latitude  ? Number(form.latitude)  : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
        arrivedAt:   form.arrivedAt   || undefined,
        completedAt: form.completedAt || undefined,
        findings:    form.findings    || undefined,
        photos: form.photos.length > 0 ? JSON.stringify(form.photos) : undefined,
      }),
    onSuccess: () => {
      toast.success('Field visit logged');
      setForm({ visitType: 'BUSINESS', latitude: '', longitude: '', arrivedAt: '', completedAt: '', findings: '', photos: [] });
      qc.invalidateQueries({ queryKey: ['customer-field-visits', customerId] });
      qc.invalidateQueries({ queryKey: ['customer360', customerId] });
    },
    onError: (e: unknown) =>
      toast.error(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Failed to log visit',
      ),
  });

  function captureGps() {
    if (!navigator.geolocation) { toast.error('Geolocation not supported on this device'); return; }
    toast.loading('Getting GPS location…', { id: 'gps' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude:  pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        toast.success(`📍 ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`, { id: 'gps' });
      },
      (err) => {
        toast.error(
          err.code === 1
            ? 'Location access denied — allow location in browser settings'
            : 'Could not get location',
          { id: 'gps' },
        );
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX = 800;
          let { width, height } = img;
          if (width > MAX || height > MAX) {
            if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
            else { width = Math.round((width * MAX) / height); height = MAX; }
          }
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
          setForm((f) => ({ ...f, photos: [...f.photos, canvas.toDataURL('image/jpeg', 0.6)] }));
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  }

  return (
    <div className="space-y-5">

      {/* ── Log new visit ── */}
      {canLog && (
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <Navigation className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-semibold text-gray-800">Log Field Visit</h3>
          </div>
          <div className="card-body space-y-4">

            {/* No loan application yet — show info instead of broken form */}
            {!hasLoanApp ? (
              <div className="banner-warning flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  A loan application must exist for this customer before field visits can be logged here.
                  Ask the loan officer to create an application first, or log the visit from within the
                  loan application's <strong>Field Visits</strong> tab in the Compliance queue.
                </p>
              </div>
            ) : (
              <>
                {/* Visit type + timestamps */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="form-label">Visit Type</label>
                    <select className="form-input" value={form.visitType}
                      onChange={(e) => setForm((f) => ({ ...f, visitType: e.target.value }))}>
                      {VISIT_TYPES.map((t) => (
                        <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Arrived At</label>
                    <input type="datetime-local" className="form-input" value={form.arrivedAt}
                      onChange={(e) => setForm((f) => ({ ...f, arrivedAt: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label">Completed At</label>
                    <input type="datetime-local" className="form-input" value={form.completedAt}
                      onChange={(e) => setForm((f) => ({ ...f, completedAt: e.target.value }))} />
                  </div>
                </div>

                {/* GPS */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Latitude</label>
                      <input type="number" step="any" className="form-input" placeholder="e.g. 6.5244"
                        value={form.latitude}
                        onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))} />
                    </div>
                    <div>
                      <label className="form-label">Longitude</label>
                      <input type="number" step="any" className="form-input" placeholder="e.g. 3.3792"
                        value={form.longitude}
                        onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))} />
                    </div>
                  </div>
                  <button type="button" onClick={captureGps} className="btn-primary btn-sm gap-1.5 w-full">
                    <MapPin className="w-3.5 h-3.5" /> 📍 Capture My GPS Location Now
                  </button>
                  {form.latitude && form.longitude && (
                    <a href={`https://maps.google.com/?q=${form.latitude},${form.longitude}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Preview on Google Maps: {form.latitude}, {form.longitude}
                    </a>
                  )}
                </div>

                {/* Findings */}
                <div>
                  <label className="form-label">Findings / Observations</label>
                  <textarea className="form-input" rows={3}
                    placeholder="What did you observe? Business premises, residence, stock, staff…"
                    value={form.findings}
                    onChange={(e) => setForm((f) => ({ ...f, findings: e.target.value }))} />
                </div>

                {/* Photo upload */}
                <div>
                  <label className="form-label">Business / Premises Photos</label>
                  <input type="file" accept="image/*" multiple capture="environment"
                    className="hidden" id="kyc-visit-photo" onChange={handlePhotos} />
                  <label htmlFor="kyc-visit-photo"
                    className="btn-secondary btn-sm gap-1.5 w-full cursor-pointer flex items-center justify-center">
                    <Camera className="w-3.5 h-3.5" /> 📷 Take / Upload Photos
                  </label>
                  {form.photos.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.photos.map((src, i) => (
                        <div key={i} className="relative">
                          <img src={src} alt={`Photo ${i + 1}`}
                            className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                          <button
                            onClick={() => setForm((f) => ({ ...f, photos: f.photos.filter((_, idx) => idx !== i) }))}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => logMutation.mutate()}
                  disabled={!form.visitType || logMutation.isPending}
                  className="btn-primary gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {logMutation.isPending ? 'Saving…' : 'Save Field Visit'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Visit history ── */}
      <div className="card">
        <div className="card-header flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-semibold text-gray-800">
            Visit History ({visits.length})
          </h3>
        </div>
        <div className="card-body">
          {isLoading ? (
            <p className="text-sm text-gray-400 text-center py-4">Loading…</p>
          ) : visits.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-gray-200 rounded-lg">
              <Navigation className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No field visits logged yet.</p>
              {canLog && (
                <p className="text-xs text-gray-400 mt-1">
                  Use the form above to log a visit with GPS and photos.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {visits.map((v: FieldVisit) => (
                <div key={v.id}
                  className="p-3 rounded-lg bg-gray-50 border border-gray-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-700 uppercase tracking-wide">{v.visitType} Visit</span>
                    <span className="text-gray-400">{formatDateTime(v.createdAt)}</span>
                  </div>
                  {v.arrivedAt && (
                    <p className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      {formatDateTime(v.arrivedAt)}
                      {v.completedAt && <> → {formatDateTime(v.completedAt)}</>}
                    </p>
                  )}
                  {v.latitude && v.longitude && (
                    <a href={`https://maps.google.com/?q=${v.latitude},${v.longitude}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-brand-600 hover:underline">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {Number(v.latitude).toFixed(6)}, {Number(v.longitude).toFixed(6)}
                      <span className="text-gray-400 ml-1">— View on Maps</span>
                    </a>
                  )}
                  {v.findings && (
                    <p className="text-gray-700 whitespace-pre-wrap">{v.findings}</p>
                  )}
                  {v.photos && (() => {
                    try {
                      const photos = JSON.parse(v.photos) as string[];
                      return photos.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {photos.map((src, i) => (
                            <a key={i} href={src} target="_blank" rel="noopener noreferrer">
                              <img src={src} alt={`Visit photo ${i + 1}`}
                                className="w-16 h-16 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity" />
                            </a>
                          ))}
                        </div>
                      ) : null;
                    } catch { return null; }
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
