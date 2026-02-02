import React, { useState, useEffect } from 'react';
import type { SavedOutfit, Garment } from '../types';
import * as wardrobeService from '../services/wardrobeService';
import Logo from './Logo';
import TrashIcon from './icons/TrashIcon';
import WardrobeIcon from './icons/WardrobeIcon';

const GarmentDetail: React.FC<{ garment: Garment | null, size: string | null }> = ({ garment, size }) => {
    if (!garment) return null;
    return (
        <div className="flex items-center gap-3">
            <img src={garment.imageUrl} alt={garment.name} className="w-12 h-12 rounded-md object-cover flex-shrink-0" />
            <div>
                <p className="font-semibold text-sm text-gray-800">{garment.name}</p>
                <p className="text-xs text-gray-500">{garment.brand} - Size: <strong>{size || 'N/A'}</strong></p>
            </div>
        </div>
    );
};


const WardrobePage: React.FC = () => {
    const [outfits, setOutfits] = useState<SavedOutfit[]>([]);

    useEffect(() => {
        setOutfits(wardrobeService.getSavedOutfits());
    }, []);

    const handleDelete = (outfitId: string) => {
        if (window.confirm('Are you sure you want to delete this outfit from your wardrobe?')) {
            wardrobeService.deleteOutfit(outfitId);
            setOutfits(wardrobeService.getSavedOutfits());
        }
    };
    
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    return (
        <div className="bg-background min-h-screen font-sans text-gray-800">
            <header className="py-6 px-4 sm:px-6 lg:px-8 bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <Logo />
                    <button onClick={() => window.location.hash = '#/'} className="text-sm font-medium text-primary hover:underline">
                        &larr; Back to App
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-3 mb-8">
                        <WardrobeIcon className="h-8 w-8 text-primary"/>
                        <h1 className="text-3xl font-bold text-gray-900">My Wardrobe</h1>
                    </div>
                    
                    {outfits.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {outfits.map(outfit => (
                                <div key={outfit.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col group relative">
                                    <img src={outfit.generatedImageUrl} alt="Saved outfit" className="w-full h-80 object-cover object-top" />
                                    <div className="p-4 flex-grow flex flex-col">
                                        <div className="space-y-4 flex-grow">
                                            <GarmentDetail garment={outfit.upperGarment} size={outfit.upperGarmentSize} />
                                            <GarmentDetail garment={outfit.lowerGarment} size={outfit.lowerGarmentSize} />
                                        </div>
                                        <p className="text-xs text-gray-400 text-right mt-4 pt-2 border-t">Saved on {formatDate(outfit.createdAt)}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(outfit.id)}
                                        className="absolute top-2 right-2 bg-white/50 text-gray-700 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                                        aria-label="Delete outfit"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-gray-50 rounded-lg">
                            <WardrobeIcon className="mx-auto h-16 w-16 text-gray-400"/>
                            <h2 className="mt-4 text-xl font-semibold text-gray-800">Your wardrobe is empty.</h2>
                            <p className="mt-2 text-muted">Go create a virtual try-on and save your favorite looks here!</p>
                             <button onClick={() => window.location.hash = '#/'} className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-focus">
                                Find an Outfit
                            </button>
                        </div>
                    )}
                </div>
            </main>
             <footer className="py-4 text-center text-xs text-gray-500">
                <p>&copy; {new Date().getFullYear()} Style Sync. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default WardrobePage;
