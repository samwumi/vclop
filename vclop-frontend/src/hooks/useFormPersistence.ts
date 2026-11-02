import { useCallback } from 'react';
import { debounce } from '@/lib/utils';

/**
 * Auto-save form data to localStorage and restore on mount
 * @param formKey Unique key for this form (e.g., 'new-customer-form')
 */
export function useFormPersistence(formKey: string) {
  const storageKey = `form-draft:${formKey}`;

  // Save form data to localStorage (debounced to avoid too many writes)
  const saveFormData = useCallback(
    debounce((formElement: HTMLFormElement) => {
      const formData = new FormData(formElement);
      const data: Record<string, any> = {};

      formData.forEach((value, key) => {
        // Handle checkboxes and multi-select
        if (data[key]) {
          if (Array.isArray(data[key])) {
            data[key].push(value);
          } else {
            data[key] = [data[key], value];
          }
        } else {
          data[key] = value;
        }
      });

      localStorage.setItem(storageKey, JSON.stringify({
        data,
        timestamp: new Date().toISOString(),
      }));
    }, 500),
    [storageKey]
  );

  // Restore form data from localStorage
  const restoreFormData = useCallback((formElement: HTMLFormElement) => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return false;

      const { data, timestamp } = JSON.parse(saved);
      
      // Check if saved data is older than 24 hours
      const savedDate = new Date(timestamp);
      const hoursSinceSave = (Date.now() - savedDate.getTime()) / (1000 * 60 * 60);
      if (hoursSinceSave > 24) {
        localStorage.removeItem(storageKey);
        return false;
      }

      // Restore form values
      Object.entries(data).forEach(([key, value]) => {
        const element = formElement.elements.namedItem(key) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        if (element) {
          if (element instanceof HTMLInputElement) {
            if (element.type === 'checkbox' || element.type === 'radio') {
              element.checked = element.value === value;
            } else {
              element.value = value as string;
            }
          } else {
            element.value = value as string;
          }
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to restore form data:', error);
      return false;
    }
  }, [storageKey]);

  // Clear saved form data
  const clearFormData = useCallback(() => {
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  // Set up auto-save on form input
  const setupAutoSave = useCallback((formElement: HTMLFormElement | null) => {
    if (!formElement) return;

    const handleInput = () => saveFormData(formElement);
    formElement.addEventListener('input', handleInput);
    formElement.addEventListener('change', handleInput);

    // Restore data on mount
    restoreFormData(formElement);

    return () => {
      formElement.removeEventListener('input', handleInput);
      formElement.removeEventListener('change', handleInput);
    };
  }, [saveFormData, restoreFormData]);

  return {
    setupAutoSave,
    clearFormData,
    restoreFormData,
  };
}
