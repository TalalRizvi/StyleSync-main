const API_BASE_URL = '';
const BRAND_ID = 'brand_streetstar_001';

export interface ApiGarment {
  id: string;
  brand_id: string;
  name: string;
  type: string;
  category: string;
  color: string;
  description?: string;
  image_url: string;
  price: number;
  currency: string;
  size_chart: string;
  active: number;
  created_at: string;
}

export interface ApiGarmentExtended extends ApiGarment {
  back_image_url?: string;
  side_image_url?: string;
}

function apiToAppGarment(apiGarment: any): any {
  return {
    id: apiGarment.id,
    name: apiGarment.name,
    brand: 'Street Star',
    bodyPlacement: apiGarment.category,
    type: apiGarment.type,
    color: apiGarment.color,
    imageUrl: apiGarment.image_url,
    backImageUrl: apiGarment.back_image_url,
    sideImageUrl: apiGarment.side_image_url,
    sizeChart: JSON.parse(apiGarment.size_chart),
    description: apiGarment.description || '',
    price: apiGarment.price,
    currency: apiGarment.currency,
  };
}

function appToApiGarment(garment: any): any {
  return {
    name: garment.name,
    type: garment.type,
    bodyPlacement: garment.bodyPlacement,
    color: garment.color,
    description: garment.description,
    imageUrl: garment.imageUrl,
    backImageUrl: garment.backImageUrl,
    sideImageUrl: garment.sideImageUrl,
    sizeChart: garment.sizeChart,
    price: garment.price || 0,
    currency: garment.currency || 'USD',
  };
}

export async function getGarments(): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/api/brands/${BRAND_ID}/garments`);
  const data = await response.json();
  if (data.success) {
    return data.garments.map(apiToAppGarment);
  }
  throw new Error(data.error || 'Failed to fetch garments');
}

export async function addGarment(garment: any): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/brands/${BRAND_ID}/garments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(appToApiGarment(garment)),
  });
  const data = await response.json();
  if (data.success) {
    return apiToAppGarment({ ...data.garment, brand_id: BRAND_ID, active: 1, created_at: new Date().toISOString(), currency: 'USD' });
  }
  throw new Error(data.error || 'Failed to add garment');
}

export async function updateGarment(garment: any): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/brands/${BRAND_ID}/garments/${garment.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(appToApiGarment(garment)),
  });
  const data = await response.json();
  if (data.success) {
    return garment;
  }
  throw new Error(data.error || 'Failed to update garment');
}

export async function deleteGarment(garmentId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/brands/${BRAND_ID}/garments/${garmentId}`, {
    method: 'DELETE',
  });
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to delete garment');
  }
}
