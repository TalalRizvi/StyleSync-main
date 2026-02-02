import React, { useState, useEffect } from 'react';
import { AppState, Garment, Measurements } from './types';
import { estimateMeasurementsFromImage } from './services/geminiService';
import { initializeCatalog } from './services/catalogService';

import UploadStep from './components/UploadStep';
import ModelGenerationStep from './components/ModelGenerationStep';
import MeasurementsStep from './components/MeasurementsStep';
import GarmentTypeSelectionStep from './components/GarmentTypeSelectionStep';
import BrandSelectionStep from './components/BrandSelectionStep';
import GarmentSelectionStep from './components/GarmentSelectionStep';
import ResultsStep from './components/ResultsStep';
import StepIndicator from './components/StepIndicator';
import Logo from './components/Logo';
import AdminPage from './components/admin/AdminPage';
import LoginPage from './components/admin/LoginPage';
import Tutorial from './components/Tutorial';
import WardrobePage from './components/WardrobePage';
import WardrobeIcon from './components/icons/WardrobeIcon';
import ThemeToggle from './components/ThemeToggle';


const App: React.FC = () => {
    // App State
    const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
    const [userImage, setUserImage] = useState<{ file: File; base64: string; mimeType: string; } | null>(null);
    const [modelImage, setModelImage] = useState<{ base64: string; mimeType: string; } | null>(null);
    const [measurements, setMeasurements] = useState<Measurements | null>(null);
    const [selectedUpperGarment, setSelectedUpperGarment] = useState<Garment | null>(null);
    const [customUpperGarmentImage, setCustomUpperGarmentImage] = useState<{ base64: string; mimeType: string } | null>(null);
    const [selectedLowerGarment, setSelectedLowerGarment] = useState<Garment | null>(null);
    const [customLowerGarmentImage, setCustomLowerGarmentImage] = useState<{ base64: string; mimeType: string } | null>(null);
    const [garmentSelectionContext, setGarmentSelectionContext] = useState<'upper' | 'lower' | null>(null);
    const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
    
    // UI State
    const [isEstimating, setIsEstimating] = useState(false);
    const [estimationError, setEstimationError] = useState<string | null>(null);
    const [locationHash, setLocationHash] = useState(window.location.hash);
    const [showTutorial, setShowTutorial] = useState(false);
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            const savedTheme = window.localStorage.getItem('theme');
            if (savedTheme) return savedTheme;
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'light';
    });


    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        initializeCatalog(); // Ensure catalog is ready in localStorage
        const handleHashChange = () => {
            setLocationHash(window.location.hash);
        };
        window.addEventListener('hashchange', handleHashChange);

        const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
        if (!hasSeenTutorial) {
            setShowTutorial(true);
            localStorage.setItem('hasSeenTutorial', 'true');
        }

        // Check for admin auth in session storage
        if (sessionStorage.getItem('isAdminAuthenticated') === 'true') {
            setIsAdminAuthenticated(true);
        }


        return () => {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, []);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };
    
     const handleLoginSuccess = () => {
        sessionStorage.setItem('isAdminAuthenticated', 'true');
        setIsAdminAuthenticated(true);
    };

    const handleLogout = () => {
        sessionStorage.removeItem('isAdminAuthenticated');
        setIsAdminAuthenticated(false);
        window.location.hash = '#/admin'; // Go back to login
    };

    const resetState = () => {
        setAppState(AppState.UPLOAD);
        setUserImage(null);
        setModelImage(null);
        setMeasurements(null);
        setSelectedUpperGarment(null);
        setCustomUpperGarmentImage(null);
        setSelectedLowerGarment(null);
        setCustomLowerGarmentImage(null);
        setGarmentSelectionContext(null);
        setSelectedBrand(null);
        setIsEstimating(false);
        setEstimationError(null);
        window.location.hash = '#/';
    };
    

    const handleEstimateMeasurements = async () => {
        if (!userImage) return;
        setIsEstimating(true);
        setEstimationError(null);
        setAppState(AppState.MEASUREMENTS);
        try {
            const estimated = await estimateMeasurementsFromImage(userImage.base64, userImage.mimeType);
            setMeasurements(estimated);
        } catch (error) {
            setEstimationError(error instanceof Error ? error.message : "Couldn't estimate measurements. Please enter them manually.");
            setMeasurements(null);
        } finally {
            setIsEstimating(false);
        }
    };
    
    const handleMeasurementsConfirmed = (confirmedMeasurements: Measurements) => {
        setMeasurements(confirmedMeasurements);
        setAppState(AppState.GARMENT_TYPE_SELECTION);
    };

    const handleGarmentTypeSelected = (type: 'upper' | 'lower') => {
        setGarmentSelectionContext(type);
        setAppState(AppState.BRAND_SELECTION);
    };

    const handleBrandSelected = (brand: string) => {
        setSelectedBrand(brand);
        if (garmentSelectionContext === 'upper') {
            setAppState(AppState.UPPER_GARMENT_SELECTION);
        } else if (garmentSelectionContext === 'lower') {
            setAppState(AppState.LOWER_GARMENT_SELECTION);
        }
    };
    
    const handleUpperGarmentSelected = (garment: Garment) => {
        setSelectedUpperGarment(garment);
    };

    const handleLowerGarmentSelected = (garment: Garment) => {
        setSelectedLowerGarment(garment);
    };
    
    const handleAddLowerGarment = () => {
        setGarmentSelectionContext('lower');
        setAppState(AppState.BRAND_SELECTION);
    };
    
    const handleAddUpperGarment = () => {
        setGarmentSelectionContext('upper');
        setAppState(AppState.BRAND_SELECTION);
    };

    const handleRemoveLowerGarment = () => {
        setSelectedLowerGarment(null);
    };
    
    const onChangeUpperGarment = () => {
        setSelectedUpperGarment(null);
        setCustomUpperGarmentImage(null);
        setGarmentSelectionContext('upper');
        setAppState(AppState.BRAND_SELECTION);
    }

    const onChangeLowerGarment = () => {
        setSelectedLowerGarment(null);
        setCustomLowerGarmentImage(null);
        setGarmentSelectionContext('lower');
        setAppState(AppState.BRAND_SELECTION);
    }
    

    const renderStep = () => {
        switch (appState) {
            case AppState.UPLOAD:
                return <UploadStep setUserImage={setUserImage} onNext={handleEstimateMeasurements} />;
            case AppState.MODEL_GENERATION:
                // Skip this step - go directly to measurements
                return <MeasurementsStep initialMeasurements={measurements} setMeasurements={handleMeasurementsConfirmed} onNext={() => setAppState(AppState.GARMENT_TYPE_SELECTION)} onBack={() => setAppState(AppState.UPLOAD)} isEstimating={isEstimating} estimationError={estimationError} />;
            case AppState.MEASUREMENTS:
                return <MeasurementsStep initialMeasurements={measurements} setMeasurements={handleMeasurementsConfirmed} onNext={() => setAppState(AppState.GARMENT_TYPE_SELECTION)} onBack={() => setAppState(AppState.UPLOAD)} isEstimating={isEstimating} estimationError={estimationError} />;
            case AppState.GARMENT_TYPE_SELECTION:
                return <GarmentTypeSelectionStep onSelectUpper={() => handleGarmentTypeSelected('upper')} onSelectLower={() => handleGarmentTypeSelected('lower')} onBack={() => setAppState(AppState.MEASUREMENTS)} />;
            case AppState.BRAND_SELECTION:
                return <BrandSelectionStep garmentType={garmentSelectionContext!} onSelectBrand={handleBrandSelected} onBack={() => setAppState(AppState.GARMENT_TYPE_SELECTION)} />;
            case AppState.UPPER_GARMENT_SELECTION:
                return <GarmentSelectionStep garmentType="upper" selectedBrand={selectedBrand!} setSelectedGarment={handleUpperGarmentSelected} setCustomGarmentImage={setCustomUpperGarmentImage} onNext={() => setAppState(AppState.RESULTS)} onBack={() => setAppState(AppState.BRAND_SELECTION)} />;
            case AppState.LOWER_GARMENT_SELECTION:
                return <GarmentSelectionStep garmentType="lower" selectedBrand={selectedBrand!} setSelectedGarment={handleLowerGarmentSelected} setCustomGarmentImage={setCustomLowerGarmentImage} onNext={() => setAppState(AppState.RESULTS)} onBack={() => setAppState(AppState.BRAND_SELECTION)} />;
            case AppState.RESULTS:
                 if (!userImage || !measurements || (!selectedUpperGarment && !selectedLowerGarment)) {
                    return <div className="text-center"><p>Something went wrong. Please start over.</p><button onClick={resetState}>Restart</button></div>
                 }
                return <ResultsStep 
                    userImage={{ base64: userImage.base64, mimeType: userImage.mimeType }}
                    measurements={measurements}
                    selectedUpperGarment={selectedUpperGarment}
                    customUpperGarmentImage={customUpperGarmentImage}
                    selectedLowerGarment={selectedLowerGarment}
                    customLowerGarmentImage={customLowerGarmentImage}
                    onRestart={resetState}
                    onAddLowerGarment={handleAddLowerGarment}
                    onRemoveLowerGarment={handleRemoveLowerGarment}
                    onChangeUpperGarment={onChangeUpperGarment}
                    onAddUpperGarment={handleAddUpperGarment}
                    onChangeLowerGarment={onChangeLowerGarment}
                />;
            default:
                return <UploadStep setUserImage={setUserImage} onNext={handleEstimateMeasurements} />;
        }
    };
    
    if (locationHash.startsWith('#/admin')) {
      if (isAdminAuthenticated) {
        return <AdminPage onLogout={handleLogout} />;
      }
      return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }
    
    if (locationHash.startsWith('#/wardrobe')) {
      return <WardrobePage />;
    }


    return (
        <div className="font-sans text-text bg-background min-h-screen">
            {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
            <header className="py-6 px-4 sm:px-6 lg:px-8 bg-card border-b border-border">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <Logo />
                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={() => window.location.hash = '#/wardrobe'} 
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer"
                        >
                            <WardrobeIcon className="h-5 w-5" />
                            My Wardrobe
                        </button>
                        <button 
                            onClick={() => window.location.hash = '#/admin'} 
                            className="text-sm font-medium text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer"
                        >
                            Admin Panel
                        </button>
                         <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                    </div>
                </div>
            </header>
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="max-w-4xl mx-auto">
                    {appState !== AppState.RESULTS && (
                         <div className="mb-12 flex justify-center">
                            <StepIndicator currentStep={appState} />
                        </div>
                    )}
                    {renderStep()}
                </div>
            </main>
             <footer className="py-4 text-center text-xs text-muted">
                <p>&copy; {new Date().getFullYear()} Style Sync. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default App;