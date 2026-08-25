import { AlertTriangle, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  requireConfirmation?: boolean; // Require typing "DELETE" or similar
  confirmationKeyword?: string;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  requireConfirmation = false,
  confirmationKeyword = 'DELETE',
}: ConfirmDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  const isValid = !requireConfirmation || confirmInput === confirmationKeyword;

  useEffect(() => {
    if (!isOpen) {
      setConfirmInput('');
      setIsConfirming(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!isValid) return;
    
    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Confirmation action failed:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  if (!isOpen) return null;

  const variantStyles = {
    danger: 'bg-red-100 text-red-600',
    warning: 'bg-amber-100 text-amber-600',
    info: 'bg-blue-100 text-blue-600',
  };

  const buttonStyles = {
    danger: 'btn-danger',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
    info: 'btn-primary',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${variantStyles[variant]}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isConfirming}
            className="btn-ghost btn-icon w-8 h-8 -mt-1 -mr-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {requireConfirmation && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="font-mono font-bold">{confirmationKeyword}</span> to confirm
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                className="form-input"
                placeholder={confirmationKeyword}
                disabled={isConfirming}
                autoFocus
              />
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              disabled={isConfirming}
              className="btn-secondary btn-sm"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isValid || isConfirming}
              className={`btn-sm disabled:opacity-50 ${buttonStyles[variant]}`}
            >
              {isConfirming ? 'Processing…' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for managing confirm dialog state
 */
export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<Omit<ConfirmDialogProps, 'isOpen' | 'onClose' | 'onConfirm'>>({
    title: 'Confirm Action',
    description: 'Are you sure you want to proceed?',
  });
  const [onConfirmCallback, setOnConfirmCallback] = useState<(() => void | Promise<void>) | null>(null);

  const open = (
    confirmCallback: () => void | Promise<void>,
    dialogConfig?: Partial<Omit<ConfirmDialogProps, 'isOpen' | 'onClose' | 'onConfirm'>>,
  ) => {
    setOnConfirmCallback(() => confirmCallback);
    setConfig(prev => ({ ...prev, ...dialogConfig }));
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setOnConfirmCallback(null);
  };

  const ConfirmDialogComponent = () => (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={close}
      onConfirm={onConfirmCallback || (() => {})}
      {...config}
    />
  );

  return {
    open,
    close,
    ConfirmDialog: ConfirmDialogComponent,
  };
}
