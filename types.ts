export enum AppState {
  UPLOAD = 1,
  MODEL_GENERATION = 2,
  MEASUREMENTS = 3,
  GARMENT_TYPE_SELECTION = 4,
  BRAND_SELECTION = 5,
  UPPER_GARMENT_SELECTION = 6,
  LOWER_GARMENT_SELECTION = 7,
  RESULTS = 8,
}

export interface Measurements {
  height: number;
  weight: number;
  chest: number;
  waist: number;
}

export interface SizeChart {
  [size: string]: {
    chest?: string;
    waist?: string;
    sleeve?: string;
    inseam?: string;
    length?: string;
    shoulder?: string;
    hip?: string;
  };
}

export interface Garment {
  id: string;
  name: string;
  brand: string;
  bodyPlacement: 'upper' | 'lower';
  type: string;
  color: string;
  imageUrl: string;
  sizeChart: SizeChart;
  description?: string;
}

export interface FitRecommendation {
  recommendedSize: string;
  projectedFit: string;
  confidenceScore: number;
  alternatives: {
    size: string;
    fit: string;
  }[];
}

export interface SavedOutfit {
  id: string;
  generatedImageUrl: string;
  upperGarment: Garment | null;
  upperGarmentSize: string | null;
  lowerGarment: Garment | null;
  lowerGarmentSize: string | null;
  createdAt: string;
}