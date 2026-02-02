
import React from 'react';
import { AppState } from '../types';

interface StepIndicatorProps {
  currentStep: AppState;
}

const displaySteps = [
  { id: 1, name: 'Upload', appStates: [AppState.UPLOAD] },
  { id: 2, name: 'Sizing', appStates: [AppState.MEASUREMENTS] },
  { id: 3, name: 'Style', appStates: [AppState.GARMENT_TYPE_SELECTION, AppState.BRAND_SELECTION, AppState.UPPER_GARMENT_SELECTION, AppState.LOWER_GARMENT_SELECTION] },
  { id: 4, name: 'Result', appStates: [AppState.RESULTS] },
];

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const currentDisplayStep = displaySteps.find(step => step.appStates.includes(currentStep)) || displaySteps[0];

  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {displaySteps.map((step, stepIdx) => {
          const isComplete = step.id < currentDisplayStep.id;
          const isActive = step.id === currentDisplayStep.id;

          return (
            <li key={step.name} className={`relative ${stepIdx !== displaySteps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
              {isComplete ? (
                <>
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="h-0.5 w-full bg-primary" />
                  </div>
                  <div className="relative flex h-8 w-8 items-center justify-center bg-primary rounded-full">
                    <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" />
                    </svg>
                     <span className="absolute top-10 w-max text-center text-xs text-primary font-medium">{step.name}</span>
                  </div>
                </>
              ) : isActive ? (
                <>
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="h-0.5 w-full bg-gray-200" />
                  </div>
                  <div className="relative flex h-8 w-8 items-center justify-center bg-white border-2 border-primary rounded-full">
                    <span className="h-2.5 w-2.5 bg-primary rounded-full" aria-hidden="true" />
                    <span className="absolute top-10 w-max text-center text-xs text-primary font-bold">{step.name}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="h-0.5 w-full bg-gray-200" />
                  </div>
                  <div className="group relative flex h-8 w-8 items-center justify-center bg-white border-2 border-gray-300 rounded-full">
                     <span className="absolute top-10 w-max text-center text-xs text-muted">{step.name}</span>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default StepIndicator;