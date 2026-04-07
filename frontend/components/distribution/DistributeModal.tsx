'use client';

import { useState, useEffect } from 'react';
import { ipcClient } from '@/lib/ipc-client';
import { AppModal } from '@/components/shared/AppModal';
import { StepIndicator } from '@/components/shared/StepIndicator';
import { DistributeStep1Form } from './DistributeStep1Form';
import { DistributeStep2Review } from './DistributeStep2Review';
import type { DistributionTailorSummary, Step1Values } from '@/features/distribution/distribution.types';
import type { NonFabricItem } from '@/features/cutting/cutting.types';

interface DistributeModalProps {
  onClose: () => void;
  onSuccess: (summary: DistributionTailorSummary) => void;
}

const STEP_LABELS = ['معلومات التوزيع', 'مراجعة وتأكيد'];

export function DistributeModal({ onClose, onSuccess }: DistributeModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<Step1Values | null>(null);
  const [nonFabricItems, setNonFabricItems] = useState<NonFabricItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    ipcClient.cutting.getNonFabricItems().then(r => { if (r.success) setNonFabricItems(r.data); });
  }, []);

  function handleNext1(values: Step1Values) {
    setStep1Data(values);
    setStep(2);
  }

  async function handleSubmit2() {
    if (!step1Data) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const consumptionRows = step1Data.materialBatchConsumptions.flatMap(mc =>
        mc.batches
          .filter(b => (b.quantity ?? 0) > 0)
          .map(b => ({
            stockTransactionId: b.transactionId,
            quantity: b.quantity ?? 0,
            pricePerUnit: b.pricePerUnit,
          }))
      );

      const res = await ipcClient.distribution.distribute({
        tailorId: step1Data.tailorId,
        modelName: step1Data.modelName,
        sizeLabel: step1Data.sizeLabel,
        color: step1Data.color,
        expectedFinalQuantity: step1Data.expectedFinalQuantity,
        sewingPricePerPiece: step1Data.sewingPricePerPiece,
        distributionDate: new Date(step1Data.distributionDate).getTime(),
        parts: step1Data.partRows.map(r => ({
          partName: r.partName,
          quantity: r.quantity,
          avgUnitCost: r.avgUnitCost,
        })),
        consumptionRows,
        piecesCost: step1Data.piecesCost,
        sewingCost: step1Data.sewingCost,
        materialsCost: step1Data.consumedMaterialsCost,
        transportationCost: step1Data.transportationCost,
        totalCost: step1Data.totalCost,
        costPerFinalItem: step1Data.costPerFinalItem,
      });

      if (res.success) {
        onSuccess(res.data);
      } else {
        setSubmitError(res.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppModal
      open
      onClose={onClose}
      title="توزيع قطع جديد"
      size="lg"
    >
      <div className="space-y-4" dir="rtl">
        <StepIndicator steps={STEP_LABELS} currentStep={step - 1} />

        {step === 1 && (
          <DistributeStep1Form
            nonFabricItems={nonFabricItems}
            onNext={handleNext1}
          />
        )}

        {step === 2 && step1Data && (
          <DistributeStep2Review
            step1Data={step1Data}
            isSubmitting={isSubmitting}
            submitError={submitError}
            onSubmit={handleSubmit2}
            onBack={() => { setStep(1); setSubmitError(null); }}
          />
        )}
      </div>
    </AppModal>
  );
}
