import type { SavedOutfit } from '../types';

const WARDROBE_KEY = 'styleSyncWardrobe';

export function getSavedOutfits(): SavedOutfit[] {
  try {
    const stored = localStorage.getItem(WARDROBE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error("Could not retrieve wardrobe from localStorage:", error);
    return [];
  }
}

export function saveOutfit(outfit: Omit<SavedOutfit, 'id' | 'createdAt'>): void {
  try {
    const outfits = getSavedOutfits();
    const newOutfit: SavedOutfit = {
      ...outfit,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updatedOutfits = [newOutfit, ...outfits]; // Add to the top
    localStorage.setItem(WARDROBE_KEY, JSON.stringify(updatedOutfits));
  } catch (error) {
    console.error("Could not save outfit to localStorage:", error);
  }
}

export function deleteOutfit(outfitId: string): void {
  try {
    const outfits = getSavedOutfits();
    const updatedOutfits = outfits.filter(o => o.id !== outfitId);
    localStorage.setItem(WARDROBE_KEY, JSON.stringify(updatedOutfits));
  } catch (error) {
    console.error("Could not delete outfit from localStorage:", error);
  }
}
