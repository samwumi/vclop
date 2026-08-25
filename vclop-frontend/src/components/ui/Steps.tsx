/**
 * Step indicator for multi-step workflows
 * Perfect for loan application flow, KYC process, etc.
 */

import { Check } from 'lucide-react';

export interface Step {
  id: string;
  label: string;
  description?: string;
}

interface StepsProps {
  steps: Step[];
  currentStep: number; // 0-indexed
  orientation?: 'horizontal' | 'vertical';
  onStepClick?: (index: number) => void;
  clickable?: boolean;
}

export function Steps({
  steps,
  currentStep,
  orientation = 'horizontal',
  onStepClick,
  clickable = false,
}: StepsProps) {
  if (orientation === 'vertical') {
    return (
      <div className="space-y-1">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <div key={step.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => clickable && onStepClick?.(index)}
                  disabled={!clickable}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200
                    ${isCompleted ? 'bg-emerald-600 text-white shadow-sm' : ''}
                    ${isCurrent ? 'bg-brand-600 text-white ring-4 ring-brand-100 shadow-sm' : ''}
                    ${isUpcoming ? 'bg-gray-100 text-gray-400' : ''}
                    ${clickable ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}
                  `}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                </button>
                {index < steps.length - 1 && (
                  <div className={`w-0.5 h-8 my-1 ${index < currentStep ? 'bg-emerald-600' : 'bg-gray-200'}`} />
                )}
              </div>
              <div className="flex-1 pb-8">
                <p className={`text-sm font-medium ${isCurrent ? 'text-gray-900' : 'text-gray-600'}`}>
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal orientation
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isUpcoming = index > currentStep;

        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <button
                onClick={() => clickable && onStepClick?.(index)}
                disabled={!clickable}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200
                  ${isCompleted ? 'bg-emerald-600 text-white shadow-sm' : ''}
                  ${isCurrent ? 'bg-brand-600 text-white ring-4 ring-brand-100 shadow-sm' : ''}
                  ${isUpcoming ? 'bg-gray-100 text-gray-400' : ''}
                  ${clickable ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}
                `}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
              </button>
              <p className={`text-xs font-medium mt-2 text-center ${isCurrent ? 'text-gray-900' : 'text-gray-600'}`}>
                {step.label}
              </p>
              {step.description && (
                <p className="text-xs text-gray-500 mt-0.5 text-center">{step.description}</p>
              )}
            </div>
            {index < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-2 transition-colors duration-500 ${index < currentStep ? 'bg-emerald-600' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Simple step progress bar
 */
export function StepProgress({ current, total }: { current: number; total: number }) {
  const percentage = (current / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-gray-600">
        <span>Step {current} of {total}</span>
        <span>{Math.round(percentage)}% complete</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
