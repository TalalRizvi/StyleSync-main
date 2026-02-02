import React, { useState, useEffect, useCallback } from 'react';
import type { Measurements, Garment, FitRecommendation, SizeChart } from '../types';
import { getFitRecommendation, virtualTryOn } from '../services/geminiService';
import { getGarments } from '../services/catalogService';
import { saveOutfit } from '../services/wardrobeService';
import { trackTryOnCost } from '../services/costTracking';
import SparklesIcon from './icons/SparklesIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import RefreshIcon from './icons/RefreshIcon';
import SaveIcon from './icons/SaveIcon';
import CheckIcon from './icons/CheckIcon';
import FrontViewIcon from './icons/FrontViewIcon';
import BackViewIcon from './icons/BackViewIcon';

interface ResultsStepProps {
  userImage: { base64: string; mimeType: string };
  measurements: Measurements;
  selectedUpperGarment: Garment | null;
  customUpperGarmentImage: { base64: string; mimeType: string } | null;
  selectedLowerGarment: Garment | null;
  customLowerGarmentImage: { base64: string; mimeType: string } | null;
  onRestart: () => void;
  onAddLowerGarment: () => void;
  onRemoveLowerGarment: () => void;
  onChangeUpperGarment: () => void;
  onAddUpperGarment: () => void;
  onChangeLowerGarment: () => void;
}

const Poses = {
    'Front': { description: 'Full frontal view, standing naturally.', icon: <FrontViewIcon /> },
    'Back': { description: 'View from behind, showing the back of the person.', icon: <BackViewIcon /> },
};
type PoseKey = keyof typeof Poses;

const LoadingSpinner: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex flex-col items-center justify-center text-center p-8">
    <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p className="mt-4 text-lg font-medium text-text">{text}</p>
    <p className="text-sm text-muted">Our AI is working its magic...</p>
  </div>
);

const RecommendationCard: React.FC<{
    garment: Garment,
    recommendation: FitRecommendation | null,
    isLoading: boolean,
    selectedTryOn: { size: string, fit: string } | null,
    onSizeSelect: (size: string, fit: string) => void,
    isGeneratingTryOn: boolean,
    garmentType: 'upper' | 'lower'
    showRecommendedSize?: boolean;
}> = ({ garment, recommendation, isLoading, selectedTryOn, onSizeSelect, isGeneratingTryOn, garmentType, showRecommendedSize = true }) => {
    
    if (isLoading || !recommendation) {
        return <div className="bg-card rounded-lg p-6 min-h-[300px] flex items-center justify-center"><LoadingSpinner text={`Analyzing ${garmentType} garment...`} /></div>
    }

    const allSizes: Array<{ size: string; fit: string; isRecommended?: boolean }> = [
        { size: recommendation.recommendedSize, fit: recommendation.projectedFit, isRecommended: true },
        ...(recommendation.alternatives || [])
    ];
    
    const previewSizesTitle = showRecommendedSize ? "Preview Other Sizes" : "Select a Size to Preview";

    return (
        <div className="bg-card rounded-lg p-6 h-full">
            <h3 className="text-lg font-bold text-text mb-4">For: {garment.name}</h3>
            <div className="space-y-6">
              {showRecommendedSize && (
                <div>
                  <h4 className="text-md font-semibold text-text mb-3">Your Recommended Size</h4>
                  <div className="text-center bg-primary text-white rounded-lg p-4">
                      <p className="text-5xl font-extrabold">{recommendation.recommendedSize}</p>
                      <p className="font-medium mt-1">{recommendation.projectedFit}</p>
                  </div>
                  <p className="text-xs text-muted text-center mt-2">Confidence: {Math.round(recommendation.confidenceScore * 100)}%</p>
                </div>
              )}

              {allSizes.length > 1 && (
                 <div>
                    <h4 className="text-md font-semibold text-text mb-3">{previewSizesTitle}</h4>
                    <div className="flex flex-col space-y-2">
                        {allSizes.map(({ size, fit, isRecommended }) => (
                            <button
                                key={size}
                                onClick={() => onSizeSelect(size, fit)}
                                disabled={isGeneratingTryOn}
                                className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-wait ${selectedTryOn?.size === size ? 'bg-primary/10 dark:bg-primary/20 border-primary shadow-sm' : 'bg-background hover:bg-border border-border'}`}
                            >
                                <div className="flex justify-between items-center">
                                    <p className="font-bold text-text">{size}</p>
                                    {isRecommended && showRecommendedSize && <span className="text-xs font-semibold bg-secondary text-white px-2 py-0.5 rounded-full">Recommended</span>}
                                </div>
                                <p className="text-sm text-muted">{fit}</p>
                            </button>
                        ))}
                    </div>
                </div>
              )}
            </div>
        </div>
    )
}

// Helper to fetch image URL and convert to base64
const getBase64FromUrl = async (url: string): Promise<{ base64: string; mimeType: string }> => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch image');
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                if (!result) {
                   reject(new Error("Failed to read blob"));
                   return;
                }
                const base64 = result.split(',')[1];
                const mimeType = result.match(/:(.*?);/)?.[1] || blob.type;
                resolve({ base64, mimeType });
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error("Failed to fetch image:", url, e);
        throw e;
    }
};


const ResultsStep: React.FC<ResultsStepProps> = (props) => {
  const { userImage, measurements, selectedUpperGarment, customUpperGarmentImage, selectedLowerGarment, customLowerGarmentImage, onRestart, onAddLowerGarment, onRemoveLowerGarment, onChangeUpperGarment, onAddUpperGarment, onChangeLowerGarment } = props;
  
  const [upperRecommendation, setUpperRecommendation] = useState<FitRecommendation | null>(null);
  const [lowerRecommendation, setLowerRecommendation] = useState<FitRecommendation | null>(null);
  const [tryOnResult, setTryOnResult] = useState<{ imageUrl: string; text: string; cost?: any } | null>(null);
  const [poseCache, setPoseCache] = useState<Record<string, { imageUrl: string; text: string; cost?: any }>>({});
  const [lastTryOnCost, setLastTryOnCost] = useState<any>(null);

  const [isLoadingUpperRec, setIsLoadingUpperRec] = useState(!!selectedUpperGarment);
  const [isLoadingLowerRec, setIsLoadingLowerRec] = useState(!!selectedLowerGarment);
  const [isGeneratingTryOn, setIsGeneratingTryOn] = useState(false);
  const [isOutfitSaved, setIsOutfitSaved] = useState(false);

  const [selectedUpperTryOn, setSelectedUpperTryOn] = useState<{ size: string, fit: string } | null>(null);
  const [selectedLowerTryOn, setSelectedLowerTryOn] = useState<{ size: string, fit: string } | null>(null);
  
  const [currentPose, setCurrentPose] = useState<PoseKey>('Front');
  const [error, setError] = useState<string | null>(null);

  const getDefaultSizeChart = (placement: 'upper' | 'lower'): SizeChart => {
    const allGarments = getGarments();
    const firstMatch = allGarments.find(g => g.bodyPlacement === placement);
    return firstMatch ? firstMatch.sizeChart : {};
  }


  const fetchRecommendations = useCallback(async () => {
    setError(null);
    if (selectedUpperGarment && !upperRecommendation) {
        try {
            setIsLoadingUpperRec(true);
            const isCustomUpper = selectedUpperGarment.id === "-1";
            const upperSizeChart = isCustomUpper ? getDefaultSizeChart('upper') : selectedUpperGarment.sizeChart;
            const upperRec = await getFitRecommendation(measurements, upperSizeChart);
            setUpperRecommendation(upperRec);
            setSelectedUpperTryOn({ size: upperRec.recommendedSize, fit: upperRec.projectedFit });
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An error occurred fetching upper garment recommendation.');
        } finally {
            setIsLoadingUpperRec(false);
        }
    }

    if (selectedLowerGarment && !lowerRecommendation) {
        try {
            setIsLoadingLowerRec(true);
            const isCustomLower = selectedLowerGarment.id === "-1";
            const lowerSizeChart = isCustomLower ? getDefaultSizeChart('lower') : selectedLowerGarment.sizeChart;
            const lowerRec = await getFitRecommendation(measurements, lowerSizeChart);
            setLowerRecommendation(lowerRec);
            setSelectedLowerTryOn({ size: lowerRec.recommendedSize, fit: lowerRec.projectedFit });
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An error occurred fetching lower garment recommendation.');
        } finally {
            setIsLoadingLowerRec(false);
        }
    }
  }, [measurements, selectedUpperGarment, selectedLowerGarment, upperRecommendation, lowerRecommendation]);


  const performVirtualTryOn = useCallback(async (pose: PoseKey, forceRegenerate = false) => {
    if (!selectedUpperTryOn && !selectedLowerTryOn) return;

    let cacheKey = `pose-${pose}`;
    if (selectedUpperGarment && selectedUpperTryOn) cacheKey += `_upper-${selectedUpperGarment.id}-${selectedUpperTryOn.size}`;
    if (selectedLowerGarment && selectedLowerTryOn) cacheKey += `_lower-${selectedLowerGarment.id}-${selectedLowerTryOn.size}`;
    if (cacheKey === `pose-${pose}`) return;

    if (poseCache[cacheKey] && !forceRegenerate) {
        setTryOnResult(poseCache[cacheKey]);
        setError(null);
        return;
    }

    setIsGeneratingTryOn(true);
    setError(null);
    setTryOnResult(null);

    try {
        const useBackView = pose === 'Back';

        const getGarmentImageData = async (garment: Garment | null, customImage: { base64: string, mimeType: string } | null) => {
            if (!garment) return undefined;
            
            // 1. Custom uploaded image (User uploaded this in previous step)
            if (garment.id === "-1" && customImage) {
                return customImage;
            }

            // 2. Catalog Item - Decide whether to use back or front image
            let imageUrlToUse = garment.imageUrl;
            if (useBackView && garment.backImageUrl) {
                imageUrlToUse = garment.backImageUrl;
            }

            // Check if it's already a data URL
            if (imageUrlToUse && imageUrlToUse.startsWith('data:')) {
                const parts = imageUrlToUse.split(',');
                if (parts.length === 2) {
                    const mimeType = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
                    return { base64: parts[1], mimeType };
                }
            }
            
            // Fetch if it's a remote URL
            if (imageUrlToUse) {
                try {
                    return await getBase64FromUrl(imageUrlToUse);
                } catch (e) {
                    console.warn(`Could not fetch garment image (${useBackView ? 'Back' : 'Front'}), defaulting to fallback if available.`, e);
                    // Fallback to front image if back image fails
                    if (useBackView && garment.imageUrl && garment.imageUrl !== imageUrlToUse) {
                         try { return await getBase64FromUrl(garment.imageUrl); } catch(e2) { return undefined; }
                    }
                }
            }
            return undefined;
        };

        const upperGarmentImage = await getGarmentImageData(selectedUpperGarment, customUpperGarmentImage);
        const lowerGarmentImage = await getGarmentImageData(selectedLowerGarment, customLowerGarmentImage);

        const upperGarmentInfo = selectedUpperGarment ? {
            type: selectedUpperGarment.type,
            color: selectedUpperGarment.color,
            description: selectedUpperGarment.description,
            customImage: upperGarmentImage,
            sizeChart: selectedUpperGarment.sizeChart,
        } : null;

        const lowerGarmentInfo = selectedLowerGarment ? {
            type: selectedLowerGarment.type,
            color: selectedLowerGarment.color,
            description: selectedLowerGarment.description,
            customImage: lowerGarmentImage,
            sizeChart: selectedLowerGarment.sizeChart,
        } : null;

        const result = await virtualTryOn(
          userImage,
          measurements,
          upperGarmentInfo,
          upperRecommendation,
          selectedUpperTryOn,
          lowerGarmentInfo,
          lowerRecommendation,
          selectedLowerTryOn,
          Poses[pose].description
        );

        // Store cost information
        if (result.cost) {
          setLastTryOnCost(result.cost);
          // Track cost for analytics
          trackTryOnCost(result.cost, {
            imagesIn: (upperGarmentInfo ? 1 : 0) + (lowerGarmentInfo ? 1 : 0) + 1, // model + garments
            imagesOut: 1,
            resolution: '2K', // gemini-3-pro-image-preview default
          });
        }

        setPoseCache(prevCache => ({ ...prevCache, [cacheKey]: result }));
        setTryOnResult(result);
    } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to generate outfit preview.');
    } finally {
        setIsGeneratingTryOn(false);
    }
  }, [
      userImage, 
      measurements,
      selectedUpperGarment, 
      customUpperGarmentImage, 
      upperRecommendation,
      selectedUpperTryOn, 
      selectedLowerGarment, 
      customLowerGarmentImage, 
      lowerRecommendation,
      selectedLowerTryOn, 
      poseCache
  ]);


  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);
  
  useEffect(() => {
    if ((selectedUpperGarment && !selectedUpperTryOn) || (selectedLowerGarment && !selectedLowerTryOn)) {
        return;
    }
    // Don't auto-trigger if we are just switching garments but haven't selected a size yet
    // But here we set default size in fetchRecommendations so it should be fine.
    
    // Check if we have a result for the CURRENT pose to avoid unnecessary calls on mount
    // if we navigated back and forth.
    performVirtualTryOn(currentPose);
  }, [selectedUpperTryOn, selectedLowerTryOn, currentPose, performVirtualTryOn]);


  if (error && !tryOnResult && !isGeneratingTryOn && !isLoadingUpperRec && !isLoadingLowerRec) {
    return (
      <div className="text-center">
        <h3 className="text-xl font-semibold text-red-600">Something went wrong</h3>
        <p className="text-muted mt-2">{error}</p>
        <button onClick={onRestart} className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-focus">
          Try Again
        </button>
      </div>
    );
  }
  
  const handleSaveOutfit = () => {
    if (!tryOnResult) return;
    saveOutfit({
      generatedImageUrl: tryOnResult.imageUrl,
      upperGarment: selectedUpperGarment,
      upperGarmentSize: selectedUpperTryOn?.size || null,
      lowerGarment: selectedLowerGarment,
      lowerGarmentSize: selectedLowerTryOn?.size || null,
    });
    setIsOutfitSaved(true);
  };
  
  const handleRegenerate = () => {
    setIsOutfitSaved(false);
    performVirtualTryOn(currentPose, true);
  }

  const handleSizeSelect = (
    setter: React.Dispatch<React.SetStateAction<{ size: string; fit: string } | null>>, 
    size: string, 
    fit: string
  ) => {
    setter({size, fit});
    setIsOutfitSaved(false);
  }


  const TryOnPreview = () => {
    const handlePoseChange = (newPose: PoseKey) => {
        if (newPose === currentPose) return;
        setCurrentPose(newPose);
        setIsOutfitSaved(false);
    };
    
    return (
     <div className="bg-card rounded-lg p-6 flex flex-col h-full shadow-sm border border-border">
          <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-bold text-text">Virtual Try-On Preview</h3>
               <div className="flex gap-2">
                    <button
                        onClick={handleSaveOutfit}
                        disabled={isOutfitSaved || isGeneratingTryOn || !tryOnResult}
                        className={`font-semibold py-1.5 px-3 rounded-full text-xs flex items-center transition-colors ${isOutfitSaved ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 cursor-default' : 'bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-wait'}`}
                        aria-label={isOutfitSaved ? "Outfit Saved" : "Save Outfit"}
                    >
                        {isOutfitSaved ? <CheckIcon className="h-4 w-4 mr-1.5" /> : <SaveIcon className="h-4 w-4 mr-1.5" />}
                        {isOutfitSaved ? 'Saved' : 'Save'}
                    </button>
                    <button
                      onClick={handleRegenerate}
                      disabled={isGeneratingTryOn || !tryOnResult}
                      className="bg-secondary/10 text-secondary font-semibold py-1.5 px-3 rounded-full text-xs flex items-center hover:bg-secondary/20 disabled:opacity-50 disabled:cursor-wait transition-colors"
                      aria-label="Regenerate Preview"
                    >
                        <RefreshIcon className="h-4 w-4 mr-1.5" />
                        Regenerate
                    </button>
               </div>
          </div>

          <div className="flex-grow flex items-center justify-center min-h-[400px] bg-background rounded-lg overflow-hidden border border-border relative">
            {isGeneratingTryOn || (!tryOnResult && !error) ? (
                <LoadingSpinner text={`Generating ${currentPose} view...`} />
            ) : error && !tryOnResult ? (
                <div className="text-center p-4">
                    <h3 className="text-lg font-semibold text-red-600">Preview Generation Failed</h3>
                    <p className="text-muted mt-2">{error}</p>
                </div>
            ) : tryOnResult ? (
                <>
                    <img src={tryOnResult.imageUrl} alt={`Virtual try-on result`} className="w-full h-full object-contain" />
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white font-bold py-1 px-3 rounded-full text-xs flex items-center shadow-lg">
                        <SparklesIcon />
                        <span>AI Generated</span>
                    </div>
                </>
            ) : null}
          </div>
          
          {tryOnResult && !isGeneratingTryOn && (
              <p className="text-center text-xs text-muted mt-2 italic px-2">"{tryOnResult.text}"</p>
          )}

          {/* New Visible Pose Selection UI */}
          <div className="mt-6">
              <label className="text-sm font-semibold text-text mb-3 block">Choose a Pose:</label>
              <div className="flex flex-wrap gap-3 justify-center">
                  {(Object.keys(Poses) as PoseKey[]).map(poseKey => (
                      <button 
                          key={poseKey}
                          onClick={() => handlePoseChange(poseKey)}
                          disabled={isGeneratingTryOn}
                          className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 border-2 min-w-[80px] ${currentPose === poseKey ? 'bg-primary/10 border-primary text-primary shadow-md scale-105' : 'bg-card border-border hover:border-primary/50 text-muted hover:text-text'}`}
                          title={Poses[poseKey].description}
                      >
                          <div className={`w-10 h-10 mb-2 ${currentPose === poseKey ? 'text-primary' : 'text-current'}`}>
                             {React.cloneElement(Poses[poseKey].icon, { className: 'w-full h-full' })}
                          </div>
                          <span className="text-xs font-bold text-center">{poseKey}</span>
                      </button>
                  ))}
              </div>
          </div>
      </div>
  )}

  const hasFullOutfit = selectedUpperGarment && selectedLowerGarment;
  const hasUpperOnly = selectedUpperGarment && !selectedLowerGarment;
  const hasLowerOnly = !selectedUpperGarment && selectedLowerGarment;

  return (
    <div>
        {/* Full Outfit View */}
        {hasFullOutfit && (
             <div>
                <h2 className="text-2xl font-semibold text-text mb-4 text-center">Your Full Outfit Recommendation</h2>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
                    <div className="lg:col-span-3 lg:order-none order-first">
                      <TryOnPreview />
                    </div>
                    <div className="lg:col-span-2 flex flex-col gap-6">
                      <RecommendationCard 
                          garment={selectedUpperGarment} recommendation={upperRecommendation} isLoading={isLoadingUpperRec}
                          selectedTryOn={selectedUpperTryOn} onSizeSelect={(size, fit) => handleSizeSelect(setSelectedUpperTryOn, size, fit)}
                          isGeneratingTryOn={isGeneratingTryOn} garmentType="upper" showRecommendedSize={false}
                      />
                      <RecommendationCard 
                          garment={selectedLowerGarment} recommendation={lowerRecommendation} isLoading={isLoadingLowerRec}
                          selectedTryOn={selectedLowerTryOn} onSizeSelect={(size, fit) => handleSizeSelect(setSelectedLowerTryOn, size, fit)}
                          isGeneratingTryOn={isGeneratingTryOn} garmentType="lower" showRecommendedSize={false}
                      />
                    </div>
                </div>
                <div className="mt-8 text-center flex items-center justify-center space-x-4">
                    <button onClick={onChangeUpperGarment} className="font-medium text-primary hover:text-primary-hover">Change Upper</button>
                    <button onClick={onChangeLowerGarment} className="font-medium text-primary hover:text-primary-hover">Change Lower</button>
                    <button onClick={onRestart} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-secondary hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary">Start Over</button>
                </div>
             </div>
        )}

        {/* Upper Garment Only View */}
        {hasUpperOnly && (
            <div>
                <h2 className="text-2xl font-semibold text-text mb-4 text-center">Your Upper Garment Recommendation</h2>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
                    <div className="lg:col-span-3"><TryOnPreview /></div>
                    <div className="lg:col-span-2">
                        <RecommendationCard 
                            garment={selectedUpperGarment} recommendation={upperRecommendation} isLoading={isLoadingUpperRec}
                            selectedTryOn={selectedUpperTryOn} onSizeSelect={(size, fit) => handleSizeSelect(setSelectedUpperTryOn, size, fit)}
                            isGeneratingTryOn={isGeneratingTryOn} garmentType="upper"
                        />
                    </div>
                </div>
                 <div className="mt-8 border-t border-border pt-8 text-center">
                    <h3 className="text-xl font-semibold text-text">Complete Your Outfit</h3>
                    <p className="text-muted mt-2">Want to see how this looks with a pair of pants or shorts?</p>
                    <div className="mt-6 flex items-center justify-center space-x-4">
                        <button onClick={onRestart} className="font-medium text-muted hover:text-text">Start Over</button>
                         <button onClick={onAddLowerGarment} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-focus">Add Lower Garment <ArrowRightIcon /></button>
                         <button onClick={onChangeUpperGarment} className="font-medium text-muted hover:text-text">Change Upper</button>
                    </div>
                </div>
            </div>
        )}

        {/* Lower Garment Only View */}
        {hasLowerOnly && (
            <div>
                <h2 className="text-2xl font-semibold text-text mb-4 text-center">Your Lower Garment Recommendation</h2>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
                    <div className="lg:col-span-3"><TryOnPreview /></div>
                    <div className="lg:col-span-2">
                        <RecommendationCard 
                            garment={selectedLowerGarment} recommendation={lowerRecommendation} isLoading={isLoadingLowerRec}
                            selectedTryOn={selectedLowerTryOn} onSizeSelect={(size, fit) => handleSizeSelect(setSelectedLowerTryOn, size, fit)}
                            isGeneratingTryOn={isGeneratingTryOn} garmentType="lower"
                        />
                    </div>
                </div>
                 <div className="mt-8 border-t border-border pt-8 text-center">
                    <h3 className="text-xl font-semibold text-text">Complete Your Outfit</h3>
                    <p className="text-muted mt-2">Ready to add a shirt or jacket?</p>
                    <div className="mt-6 flex items-center justify-center space-x-4">
                        <button onClick={onRestart} className="font-medium text-muted hover:text-text">Start Over</button>
                         <button onClick={onAddUpperGarment} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-focus">Add Upper Garment <ArrowRightIcon /></button>
                         <button onClick={onChangeLowerGarment} className="font-medium text-muted hover:text-text">Change Lower</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default ResultsStep;