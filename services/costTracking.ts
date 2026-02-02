// Cost tracking service for Gemini API usage
// This can be extended to store in D1 database later

import type { TryOnCost } from './geminiService';

export interface CostRecord {
  id: string;
  timestamp: number;
  brandId?: string;
  sessionId?: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  imagesIn: number;
  imagesOut: number;
  resolution?: string;
  costUsd: number;
}

// Store costs in localStorage for now (can be moved to D1 later)
const STORAGE_KEY = 'tryon_costs';

export function trackTryOnCost(cost: TryOnCost, metadata?: {
  brandId?: string;
  sessionId?: string;
  imagesIn?: number;
  imagesOut?: number;
  resolution?: string;
}): void {
  // Log detailed cost information
  console.log('=== COST TRACKING ===');
  console.log('Model:', cost.model);
  console.log('Input tokens:', cost.inputTokens);
  console.log('Output tokens:', cost.outputTokens);
  console.log('Total tokens:', cost.totalTokens);
  console.log('Cost USD:', cost.costUsd);
  console.log('Metadata:', metadata);
  console.log('====================');
  const record: CostRecord = {
    id: `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    brandId: metadata?.brandId,
    sessionId: metadata?.sessionId,
    model: cost.model,
    inputTokens: cost.inputTokens,
    outputTokens: cost.outputTokens,
    totalTokens: cost.totalTokens,
    imagesIn: metadata?.imagesIn || 1,
    imagesOut: metadata?.imagesOut || 1,
    resolution: metadata?.resolution,
    costUsd: cost.costUsd,
  };

  // Get existing records
  const existing = getStoredCosts();
  existing.push(record);

  // Keep only last 1000 records to avoid localStorage bloat
  const trimmed = existing.slice(-1000);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Failed to store cost record:', e);
  }

  console.log('Cost tracked:', record);
}

export function getStoredCosts(): CostRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function getCostStats(): {
  totalCost: number;
  totalTryOns: number;
  avgCost: number;
  totalTokens: number;
  costByModel: Record<string, { count: number; totalCost: number }>;
  cost24h: number;
  cost7d: number;
  cost30d: number;
} {
  const costs = getStoredCosts();
  const now = Date.now();
  const day24h = 24 * 60 * 60 * 1000;
  const day7d = 7 * day24h;
  const day30d = 30 * day24h;

  const totalCost = costs.reduce((sum, c) => sum + c.costUsd, 0);
  const totalTryOns = costs.length;
  const avgCost = totalTryOns > 0 ? totalCost / totalTryOns : 0;
  const totalTokens = costs.reduce((sum, c) => sum + c.totalTokens, 0);

  const cost24h = costs
    .filter(c => now - c.timestamp < day24h)
    .reduce((sum, c) => sum + c.costUsd, 0);

  const cost7d = costs
    .filter(c => now - c.timestamp < day7d)
    .reduce((sum, c) => sum + c.costUsd, 0);

  const cost30d = costs
    .filter(c => now - c.timestamp < day30d)
    .reduce((sum, c) => sum + c.costUsd, 0);

  const costByModel: Record<string, { count: number; totalCost: number }> = {};
  costs.forEach(c => {
    if (!costByModel[c.model]) {
      costByModel[c.model] = { count: 0, totalCost: 0 };
    }
    costByModel[c.model].count++;
    costByModel[c.model].totalCost += c.costUsd;
  });

  return {
    totalCost,
    totalTryOns,
    avgCost,
    totalTokens,
    costByModel,
    cost24h,
    cost7d,
    cost30d,
  };
}

export function clearCostHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
