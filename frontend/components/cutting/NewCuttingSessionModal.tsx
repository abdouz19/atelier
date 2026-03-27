'use client';

import { useState } from 'react';
import { AppModal } from '@/components/shared/AppModal';
import { StepIndicator } from '@/components/shared/StepIndicator';
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
    <AppModal
      open
      onClose={onClose}
      title="جلسة قص جديدة"
      size="lg"
      stepIndicator={
        <StepIndicator
          steps={['معلومات القص', 'الأجزاء والمواد']}
          currentStep={step - 1}
        />
      }
    >
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
    </AppModal>
  );
}
