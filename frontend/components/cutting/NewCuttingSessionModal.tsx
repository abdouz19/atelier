'use client';

import { useState, useCallback, useEffect } from 'react';
import { AppModal } from '@/components/shared/AppModal';
import { StepIndicator } from '@/components/shared/StepIndicator';
import { CuttingStep1Form } from './CuttingStep1Form';
import { CuttingStep2Form } from './CuttingStep2Form';
import { CuttingStep3Form } from './CuttingStep3Form';
import { CuttingStep4Form } from './CuttingStep4Form';
import { ipcClient } from '@/lib/ipc-client';
import type { Step1Values } from './CuttingStep1Form';
import type { Step2Values } from './CuttingStep2Form';
import type { Step3Values } from './CuttingStep3Form';
import type { Step4Values } from './CuttingStep4Form';
import type { CuttingSessionSummary, NonFabricItem } from '@/features/cutting/cutting.types';

const STEP_LABELS = ['القماش والموديل', 'الموظفون والطبقات', 'الأجزاء والمواد', 'التوزيع والملاحظات'];

interface NewCuttingSessionModalProps {
  onClose: () => void;
  onSuccess: (session: CuttingSessionSummary) => void;
}

export function NewCuttingSessionModal({ onClose, onSuccess }: NewCuttingSessionModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [step1Data, setStep1Data] = useState<Step1Values | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Values | null>(null);
  const [step3Data, setStep3Data] = useState<Step3Values | null>(null);
  const [nonFabricItems, setNonFabricItems] = useState<NonFabricItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    ipcClient.cutting.getNonFabricItems().then(r => { if (r.success) setNonFabricItems(r.data); });
  }, []);

  const totalSessionCost =
    (step1Data?.fabricCost ?? 0) +
    (step2Data?.employeeCost ?? 0) +
    (step3Data?.consumedMaterialsCost ?? 0);

  function handleNext1(values: Step1Values) {
    setStep1Data(values);
    setStep(2);
  }

  function handleNext2(values: Step2Values) {
    setStep2Data(values);
    setStep(3);
  }

  function handleNext3(values: Step3Values) {
    setStep3Data(values);
    setStep(4);
  }

  const handleSubmit4 = useCallback(async (step4Values: Step4Values) => {
    if (!step1Data || !step2Data || !step3Data) return;
    setIsSubmitting(true);
    setSubmitError(null);

    const consumptionRows = step3Data.materialBatchConsumptions.map(mc => ({
      stockItemId: mc.stockItemId,
      color: mc.color,
      quantity: mc.batches.reduce((s, b) => s + (b.quantity || 0), 0),
    }));

    const res = await ipcClient.cutting.create({
      fabricItemId: step1Data.fabricItemId,
      fabricColor: step1Data.fabricColor,
      modelName: step1Data.modelName,
      metersUsed: step1Data.metersUsed,
      fabricBatchConsumptions: step1Data.fabricBatchEntries,
      fabricCost: step1Data.fabricCost,
      employeeEntries: step2Data.employeeEntries,
      employeeCost: step2Data.employeeCost,
      parts: step3Data.parts,
      consumptionRows,
      materialBatchConsumptions: step3Data.materialBatchConsumptions,
      consumedMaterialsCost: step3Data.consumedMaterialsCost,
      partCosts: step4Values.partCosts,
      sessionDate: new Date(step4Values.sessionDate).getTime(),
      notes: step4Values.notes,
      totalSessionCost,
    });

    setIsSubmitting(false);
    if (res.success) { onSuccess(res.data); }
    else { setSubmitError(res.error); }
  }, [step1Data, step2Data, step3Data, totalSessionCost, onSuccess]);

  return (
    <AppModal
      open
      onClose={onClose}
      title="جلسة قص جديدة"
      size="lg"
      stepIndicator={
        <StepIndicator
          steps={STEP_LABELS}
          currentStep={step - 1}
        />
      }
    >
      {step === 1 && (
        <CuttingStep1Form
          onNext={handleNext1}
          onClose={onClose}
        />
      )}
      {step === 2 && (
        <CuttingStep2Form
          onNext={handleNext2}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <CuttingStep3Form
          fabricCost={step1Data?.fabricCost ?? 0}
          employeeCost={step2Data?.employeeCost ?? 0}
          modelName={step1Data?.modelName ?? ''}
          nonFabricItems={nonFabricItems}
          onNext={handleNext3}
          onBack={() => setStep(2)}
        />
      )}
      {step === 4 && (
        <CuttingStep4Form
          fabricCost={step1Data?.fabricCost ?? 0}
          employeeCost={step2Data?.employeeCost ?? 0}
          consumedMaterialsCost={step3Data?.consumedMaterialsCost ?? 0}
          totalSessionCost={totalSessionCost}
          parts={step3Data?.parts ?? []}
          isSubmitting={isSubmitting}
          submitError={submitError}
          onSubmit={handleSubmit4}
          onBack={() => setStep(3)}
        />
      )}
    </AppModal>
  );
}
