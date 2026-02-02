import React, { useState, useEffect } from 'react';
import type { Measurements } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import HeightIcon from './icons/HeightIcon';
import WeightIcon from './icons/WeightIcon';
import ChestIcon from './icons/ChestIcon';
import WaistIcon from './icons/WaistIcon';

interface MeasurementsStepProps {
  initialMeasurements?: Measurements | null;
  setMeasurements: (measurements: Measurements) => void;
  onNext: () => void;
  onBack: () => void;
  isEstimating: boolean;
  estimationError: string | null;
}

interface FormInputs {
  feet?: number;
  inches?: number;
  weightKg?: number;
  chest?: number;
  waist?: number;
}

const MeasurementsStep: React.FC<MeasurementsStepProps> = ({ initialMeasurements, setMeasurements, onNext, onBack, isEstimating, estimationError }) => {
  const [formState, setFormState] = useState<FormInputs>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialMeasurements) {
      const feet = Math.floor(initialMeasurements.height / 12);
      const inches = initialMeasurements.height % 12;
      const weightKg = initialMeasurements.weight / 2.20462;

      setFormState({
        feet: feet,
        inches: inches,
        weightKg: Math.round(weightKg),
        chest: initialMeasurements.chest,
        waist: initialMeasurements.waist,
      });
    } else {
        setFormState({});
    }
  }, [initialMeasurements]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value === '' ? undefined : Number(value) }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formState.feet && formState.feet !== 0) newErrors.height = 'Feet is required.';
    if (!formState.inches && formState.inches !== 0) newErrors.height = 'Inches is required.';
    if (formState.inches && (formState.inches < 0 || formState.inches >= 12)) newErrors.height = 'Inches must be between 0 and 11.';
    if (!formState.weightKg || formState.weightKg <= 0) newErrors.weight = 'Weight is required.';
    if (!formState.chest || formState.chest <= 0) newErrors.chest = 'Chest measurement is required.';
    if (!formState.waist || formState.waist <= 0) newErrors.waist = 'Waist measurement is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      const heightInInches = (formState.feet || 0) * 12 + (formState.inches || 0);
      const weightInLbs = (formState.weightKg || 0) * 2.20462;

      setMeasurements({
        height: Math.round(heightInInches),
        weight: Math.round(weightInLbs),
        chest: formState.chest!,
        waist: formState.waist!,
      });
      onNext();
    }
  };

  const commonInputClass = "block w-full rounded-md border-2 bg-primary py-3 px-4 text-lg font-bold text-white shadow-sm placeholder:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-primary-focus";
  const errorInputClass = "border-red-500";
  const normalInputClass = "border-transparent";
  
  if (isEstimating) {
      return (
          <div className="flex flex-col items-center justify-center text-center p-8 min-h-[400px]">
            <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-lg font-medium text-gray-700">Estimating Measurements...</p>
            <p className="text-sm text-muted">Our AI is analyzing your photo.</p>
          </div>
      );
  }

  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">Confirm Your Measurements</h2>
      <p className="text-muted mb-6">Our AI has estimated your measurements. Please review and correct them for accuracy.</p>
      {estimationError && <p className="mb-4 text-sm font-medium text-orange-600 bg-orange-50 p-3 rounded-md">{estimationError}</p>}
      
      <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Height Input */}
        <div className="bg-gray-50 rounded-lg p-4 text-left shadow-sm border border-gray-200">
          <label className="flex items-center text-md font-semibold text-gray-800">
            <HeightIcon className="h-6 w-6 mr-3 text-primary" />
            Height
          </label>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="relative">
              <input
                type="number"
                name="feet"
                id="feet"
                className={`${commonInputClass} ${errors.height ? errorInputClass : normalInputClass}`}
                placeholder="e.g., 5"
                value={formState.feet ?? ''}
                onChange={handleChange}
                aria-describedby="feet-unit"
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                <span className="text-indigo-200 sm:text-md" id="feet-unit">ft</span>
              </div>
            </div>
            <div className="relative">
              <input
                type="number"
                name="inches"
                id="inches"
                className={`${commonInputClass} ${errors.height ? errorInputClass : normalInputClass}`}
                placeholder="e.g., 8"
                value={formState.inches ?? ''}
                onChange={handleChange}
                aria-describedby="inches-unit"
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                <span className="text-indigo-200 sm:text-md" id="inches-unit">in</span>
              </div>
            </div>
          </div>
          {errors.height && <p className="mt-2 text-xs text-red-600 text-left">{errors.height}</p>}
        </div>

        {/* Weight Input */}
        <div className="bg-gray-50 rounded-lg p-4 text-left shadow-sm border border-gray-200">
          <label htmlFor="weightKg" className="flex items-center text-md font-semibold text-gray-800">
            <WeightIcon className="h-6 w-6 mr-3 text-primary" />
            Weight
          </label>
          <div className="relative mt-2">
            <input
              type="number"
              name="weightKg"
              id="weightKg"
              className={`${commonInputClass} ${errors.weight ? errorInputClass : normalInputClass}`}
              placeholder="e.g., 68"
              value={formState.weightKg || ''}
              onChange={handleChange}
              aria-describedby="weightKg-unit"
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
              <span className="text-indigo-200 sm:text-md" id="weightKg-unit">kg</span>
            </div>
          </div>
          {errors.weight && <p className="mt-2 text-xs text-red-600 text-left">{errors.weight}</p>}
        </div>

        {/* Chest Input */}
        <div className="bg-gray-50 rounded-lg p-4 text-left shadow-sm border border-gray-200">
          <label htmlFor="chest" className="flex items-center text-md font-semibold text-gray-800">
            <ChestIcon className="h-6 w-6 mr-3 text-primary" />
            Chest
          </label>
          <div className="relative mt-2">
            <input
              type="number"
              name="chest"
              id="chest"
              className={`${commonInputClass} ${errors.chest ? errorInputClass : normalInputClass}`}
              placeholder="e.g., 40"
              value={formState.chest || ''}
              onChange={handleChange}
              aria-describedby="chest-unit"
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
              <span className="text-indigo-200 sm:text-md" id="chest-unit">in</span>
            </div>
          </div>
          {errors.chest && <p className="mt-2 text-xs text-red-600 text-left">{errors.chest}</p>}
        </div>

        {/* Waist Input */}
        <div className="bg-gray-50 rounded-lg p-4 text-left shadow-sm border border-gray-200">
          <label htmlFor="waist" className="flex items-center text-md font-semibold text-gray-800">
            <WaistIcon className="h-6 w-6 mr-3 text-primary" />
            Waist
          </label>
          <div className="relative mt-2">
            <input
              type="number"
              name="waist"
              id="waist"
              className={`${commonInputClass} ${errors.waist ? errorInputClass : normalInputClass}`}
              placeholder="e.g., 32"
              value={formState.waist || ''}
              onChange={handleChange}
              aria-describedby="waist-unit"
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
              <span className="text-indigo-200 sm:text-md" id="waist-unit">in</span>
            </div>
          </div>
          {errors.waist && <p className="mt-2 text-xs text-red-600 text-left">{errors.waist}</p>}
        </div>
      </div>
      
      <div className="mt-10 flex w-full justify-between max-w-2xl">
        <button
          onClick={onBack}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-focus"
        >
          <ArrowLeftIcon />
          Back
        </button>
        <button
          onClick={handleSubmit}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-focus"
        >
          Next:
          <ArrowRightIcon />
        </button>
      </div>
    </div>
  );
};

export default MeasurementsStep;