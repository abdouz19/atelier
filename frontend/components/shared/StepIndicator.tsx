'use client';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-0" dir="rtl">
      {steps.map((step, index) => {
        const isPast = index < currentStep;
        const isCurrent = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <div key={index} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  isPast || isCurrent
                    ? 'bg-primary-500 text-white'
                    : 'border-2 border-border text-text-muted bg-surface'
                }`}
              >
                {index + 1}
              </div>
              <span
                className={`text-xs ${
                  isCurrent ? 'font-semibold text-primary-600' : 'text-text-muted'
                }`}
              >
                {step}
              </span>
            </div>
            {!isLast && (
              <div
                className={`mb-5 h-px w-8 mx-1 transition-colors ${
                  isPast ? 'bg-primary-500' : 'bg-border'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
