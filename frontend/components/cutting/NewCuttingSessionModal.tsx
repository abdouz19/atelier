'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { CuttingStep1Form } from './CuttingStep1Form';
import { CuttingStep2Form } from './CuttingStep2Form';
import { ipcClient } from '@/lib/ipc-client';
import type { Step1Values } from './CuttingStep1Form';
import type { Step2Values } from './CuttingStep2Form';
import type { CuttingSessionSummary } from '@/features/cutting/cutting.types';

interface NewCuttingSessionModalProps {
  onClose: () => void;
  onSuccess: (session: CuttingSessionSummary) => void;
}

export function NewCuttingSessionModal({ onClose, onSuccess }: NewCuttingSessionModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<Step1Values | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function handleNext(values: Step1Values) {
    setStep1Data(values);
    setStep(2);
  }

  async function handleSubmit(values: Step2Values) {
    if (!step1Data) return;
    setIsSubmitting(true);
    setSubmitError(null);
    const res = await ipcClient.cutting.create({
      fabricItemId: step1Data.fabricItemId,
      fabricColor: step1Data.fabricColor,
      modelName: step1Data.modelName,
      sizeLabel: step1Data.sizeLabel,
      metersUsed: step1Data.metersUsed,
      employeeIds: step1Data.employeeIds,
      layers: step1Data.layers,
      pricePerLayer: step1Data.pricePerLayer,
      sessionDate: new Date(step1Data.sessionDate).getTime(),
      notes: step1Data.notes || undefined,
      parts: values.parts,
      consumptionRows: values.consumptionRows,
    });
    setIsSubmitting(false);
    if (res.success) { onSuccess(res.data); }
    else { setSubmitError(res.error); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" dir="rtl">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">جلسة قص جديدة — الخطوة {step} من 2</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="mb-4 flex gap-2">
          <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-blue-500' : 'bg-gray-200'}`} />
          <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`} />
        </div>
        {step === 1 ? (
          <CuttingStep1Form onNext={handleNext} onClose={onClose} />
        ) : (
          <CuttingStep2Form
            onSubmit={handleSubmit}
            onBack={() => setStep(1)}
            isSubmitting={isSubmitting}
            submitError={submitError}
            availableMeters={step1Data?.availableMeters ?? 0}
            modelName={step1Data?.modelName ?? ''}
          />
        )}
      </div>
    </div>
  );
}
