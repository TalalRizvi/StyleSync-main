import type { Garment } from '../types';
import { UPPER_GARMENTS, LOWER_GARMENTS } from '../constants';

const CATALOG_KEY = 'styleSyncCatalog';

// Initialize catalog from constants if it doesn't exist in localStorage
export function initializeCatalog(): void {
  try {
    if (!localStorage.getItem(CATALOG_KEY)) {
      const initialGarments = [...UPPER_GARMENTS, ...LOWER_GARMENTS];
      localStorage.setItem(CATALOG_KEY, JSON.stringify(initialGarments));
    }
  } catch (error) {
    console.error("Could not initialize catalog in localStorage:", error);
  }
}

// Get all garments from localStorage
export function getGarments(): Garment[] {
  try {
    const storedGarments = localStorage.getItem(CATALOG_KEY);
    if (storedGarments) {
      return JSON.parse(storedGarments);
    }
    // If nothing is stored, it means initialization hasn't run or failed.
    // The call in App.tsx should handle this, but we can return a default.
    const initialGarments = [...UPPER_GARMENTS, ...LOWER_GARMENTS];
    localStorage.setItem(CATALOG_KEY, JSON.stringify(initialGarments));
    return initialGarments;
  } catch (error) {
    console.error("Could not retrieve catalog from localStorage:", error);
    // Fallback to constants if localStorage is corrupt or inaccessible
    return [...UPPER_GARMENTS, ...LOWER_GARMENTS];
  }
}

// Save the entire garment list to localStorage
export function saveGarments(garments: Garment[]): void {
  try {
    localStorage.setItem(CATALOG_KEY, JSON.stringify(garments));
  } catch (error) {
    console.error("Could not save catalog to localStorage:", error);
  }
}

// Add a new garment
export function addGarment(garment: Omit<Garment, 'id'>): Garment {
  const garments = getGarments();
  const newGarment: Garment = {
    ...garment,
    id: Date.now().toString(), // Simple unique ID generation
  };
  const updatedGarments = [...garments, newGarment];
  saveGarments(updatedGarments);
  return newGarment;
}

// Update an existing garment
export function updateGarment(updatedGarment: Garment): Garment | null {
  const garments = getGarments();
  const index = garments.findIndex(g => g.id === updatedGarment.id);
  if (index !== -1) {
    garments[index] = updatedGarment;
    saveGarments(garments);
    return updatedGarment;
  }
  return null;
}

// Delete a garment by its ID
export function deleteGarment(garmentId: string): void {
  const garments = getGarments();
  const updatedGarments = garments.filter(g => g.id !== garmentId);
  saveGarments(updatedGarments);
}