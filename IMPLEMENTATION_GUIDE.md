# Style Sync - Market Readiness Implementation Guide

> **Document Version:** 1.0  
> **Created:** January 26, 2026  
> **Status:** Ready for Implementation

This document outlines the required changes to make Style Sync production-ready and secure for commercial deployment.

---

## Table of Contents

1. [Critical Security Fixes](#1-critical-security-fixes)
   - 1.1 [Move Gemini API to Backend](#11-move-gemini-api-to-backend)
   - 1.2 [Implement API Authentication](#12-implement-api-authentication)
   - 1.3 [Replace Hardcoded Admin Credentials](#13-replace-hardcoded-admin-credentials)
2. [High Priority Fixes](#2-high-priority-fixes)
   - 2.1 [Add Rate Limiting](#21-add-rate-limiting)
   - 2.2 [Remove Demo Data](#22-remove-demo-data)
   - 2.3 [Add Input Validation](#23-add-input-validation)
3. [Multi-Tenancy Implementation](#3-multi-tenancy-implementation)
4. [Production Infrastructure](#4-production-infrastructure)
5. [Code Quality Improvements](#5-code-quality-improvements)
6. [Implementation Checklist](#6-implementation-checklist)

---

## 1. Critical Security Fixes

### 1.1 Move Gemini API to Backend

**Problem:** The Gemini API key is exposed in the frontend bundle (`VITE_GEMINI_API_KEY`), allowing anyone to steal and abuse it.

**Solution:** Create Cloudflare Worker endpoints that proxy AI requests.

#### Step 1: Create AI Worker Endpoints

Create the following files in `functions/api/ai/`:

**File: `functions/api/ai/generate-model.ts`**
```typescript
interface Env {
  GEMINI_API_KEY: string;
  DB: D1Database;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  
  // Validate request origin (add your domain)
  const origin = request.headers.get('Origin');
  const allowedOrigins = ['https://yourdomain.com', 'http://localhost:5173'];
  
  if (!origin || !allowedOrigins.includes(origin)) {
    return new Response(JSON.stringify({ error: 'Unauthorized origin' }), { 
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { imageBase64, mimeType } = await request.json();
    
    // Validate input
    if (!imageBase64 || !mimeType) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Call Gemini API from server-side
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { data: imageBase64, mimeType } },
            { text: 'YOUR_PROMPT_HERE' } // Move prompt from frontend
          ]
        }],
        generationConfig: {
          responseModalities: ['IMAGE', 'TEXT']
        }
      }),
    });

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'AI service error' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}
```

**Similarly create:**
- `functions/api/ai/estimate-measurements.ts`
- `functions/api/ai/fit-recommendation.ts`
- `functions/api/ai/virtual-tryon.ts`

#### Step 2: Update wrangler.toml

Add the API key as a secret (NOT in the file):
```toml
# wrangler.toml - DO NOT put secrets here
[vars]
ENVIRONMENT = "production"
ALLOWED_ORIGINS = "https://yourdomain.com,https://app.yourdomain.com"
```

Then set the secret via CLI:
```bash
npx wrangler secret put GEMINI_API_KEY
# Enter your API key when prompted
```

#### Step 3: Update Frontend Service

**File: `services/geminiService.ts` (refactored)**
```typescript
// Remove the API key and direct Gemini calls
// Replace with calls to your Worker endpoints

const API_BASE = ''; // Same origin

export async function generateModelImage(
  userImage: { base64: string; mimeType: string }
): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(`${API_BASE}/api/ai/generate-model`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64: userImage.base64,
      mimeType: userImage.mimeType,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate model');
  }

  return response.json();
}

// Similar updates for other functions...
```

#### Step 4: Remove Frontend API Key

Delete or empty the `.env` file:
```bash
# .env - REMOVE the Gemini key
# VITE_GEMINI_API_KEY is no longer needed
```

---

### 1.2 Implement API Authentication

**Problem:** API endpoints have no authentication. Anyone can CRUD garments.

**Solution:** Implement API key authentication for brand management.

#### Step 1: Create Authentication Middleware

**File: `functions/api/_middleware.ts`**
```typescript
interface Env {
  DB: D1Database;
}

// Routes that require authentication
const PROTECTED_ROUTES = [
  { method: 'POST', pattern: /^\/api\/brands\/[^/]+\/garments$/ },
  { method: 'PUT', pattern: /^\/api\/brands\/[^/]+\/garments\/[^/]+$/ },
  { method: 'DELETE', pattern: /^\/api\/brands\/[^/]+\/garments\/[^/]+$/ },
];

// Routes that are public (read-only)
const PUBLIC_ROUTES = [
  { method: 'GET', pattern: /^\/api\/brands\/[^/]+\/garments/ },
];

export async function onRequest(context: { 
  request: Request; 
  env: Env; 
  next: () => Promise<Response>;
}) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Check if route needs protection
  const isProtected = PROTECTED_ROUTES.some(
    route => route.method === method && route.pattern.test(path)
  );

  if (!isProtected) {
    return next();
  }

  // Validate API key
  const apiKey = request.headers.get('X-API-Key');
  
  if (!apiKey) {
    return new Response(JSON.stringify({ 
      error: 'Missing API key',
      code: 'AUTH_REQUIRED' 
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Verify API key against database
  const brand = await env.DB.prepare(
    'SELECT id, name, status FROM brands WHERE api_key = ? AND status != ?'
  ).bind(apiKey, 'suspended').first();

  if (!brand) {
    return new Response(JSON.stringify({ 
      error: 'Invalid or suspended API key',
      code: 'INVALID_API_KEY' 
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Extract brandId from path and verify ownership
  const brandIdMatch = path.match(/\/api\/brands\/([^/]+)/);
  if (brandIdMatch && brandIdMatch[1] !== brand.id) {
    return new Response(JSON.stringify({ 
      error: 'API key does not have access to this brand',
      code: 'FORBIDDEN' 
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Attach brand info to request for use in handlers
  // @ts-ignore - Adding custom property
  context.brand = brand;

  return next();
}
```

#### Step 2: Generate Secure API Keys

**File: `functions/api/admin/generate-api-key.ts`**
```typescript
import { v4 as uuidv4 } from 'uuid';

interface Env {
  DB: D1Database;
  ADMIN_SECRET: string;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  
  // Verify admin secret
  const adminSecret = request.headers.get('X-Admin-Secret');
  if (adminSecret !== env.ADMIN_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 403 
    });
  }

  const { brandId } = await request.json();
  
  // Generate secure API key
  const apiKey = `sk_live_${uuidv4().replace(/-/g, '')}`;
  
  // Update brand with new API key
  await env.DB.prepare(
    'UPDATE brands SET api_key = ? WHERE id = ?'
  ).bind(apiKey, brandId).run();

  return new Response(JSON.stringify({ 
    apiKey,
    message: 'Store this key securely. It cannot be retrieved again.' 
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

#### Step 3: Update Frontend Admin Service

**File: `services/adminApiService.ts` (updated)**
```typescript
const API_BASE_URL = '';

// API key should be stored securely after login
let currentApiKey: string | null = null;

export function setApiKey(key: string) {
  currentApiKey = key;
  // Store in sessionStorage for persistence during session
  sessionStorage.setItem('adminApiKey', key);
}

export function getApiKey(): string | null {
  if (!currentApiKey) {
    currentApiKey = sessionStorage.getItem('adminApiKey');
  }
  return currentApiKey;
}

export function clearApiKey() {
  currentApiKey = null;
  sessionStorage.removeItem('adminApiKey');
}

async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
  });

  if (response.status === 401 || response.status === 403) {
    clearApiKey();
    throw new Error('Authentication failed. Please log in again.');
  }

  return response;
}

export async function addGarment(brandId: string, garment: any): Promise<any> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/brands/${brandId}/garments`,
    {
      method: 'POST',
      body: JSON.stringify(garment),
    }
  );
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to add garment');
  }
  return data.garment;
}

// Update other methods similarly...
```

---

### 1.3 Replace Hardcoded Admin Credentials

**Problem:** Admin credentials are hardcoded in frontend code.

**Solution:** Implement proper authentication flow.

#### Option A: Simple API Key Login (Recommended for MVP)

**File: `components/admin/LoginPage.tsx` (updated)**
```typescript
import React, { useState } from 'react';
import { setApiKey } from '../../services/adminApiService';
import Logo from '../Logo';

interface LoginPageProps {
  onLoginSuccess: (brandId: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [apiKey, setApiKeyInput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate API key with backend
      const response = await fetch('/api/auth/validate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
      });

      const data = await response.json();

      if (data.success) {
        setApiKey(apiKey);
        onLoginSuccess(data.brandId);
      } else {
        setError(data.error || 'Invalid API key');
      }
    } catch (err) {
      setError('Failed to authenticate. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Logo className="justify-center"/>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-text">
          Admin Panel Login
        </h2>
        <p className="mt-2 text-muted text-sm">
          Enter your brand API key to access the admin panel
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow-2xl rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-muted">
                API Key
              </label>
              <div className="mt-1">
                <input
                  id="apiKey"
                  name="apiKey"
                  type="password"
                  required
                  value={apiKey}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="sk_live_..."
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-focus focus:border-primary-focus sm:text-sm"
                />
              </div>
            </div>
            
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-focus disabled:opacity-50"
              >
                {isLoading ? 'Authenticating...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
```

#### Create Validation Endpoint

**File: `functions/api/auth/validate-key.ts`**
```typescript
interface Env {
  DB: D1Database;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  
  const apiKey = request.headers.get('X-API-Key');
  
  if (!apiKey) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'API key required' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const brand = await env.DB.prepare(
    'SELECT id, name, status, plan FROM brands WHERE api_key = ?'
  ).bind(apiKey).first();

  if (!brand) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Invalid API key' 
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (brand.status === 'suspended') {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Account suspended. Please contact support.' 
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ 
    success: true,
    brandId: brand.id,
    brandName: brand.name,
    plan: brand.plan,
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

---

## 2. High Priority Fixes

### 2.1 Add Rate Limiting

**Problem:** No rate limiting on expensive AI operations.

**Solution:** Implement rate limiting using Cloudflare's built-in features and D1.

#### Step 1: Create Rate Limiter Utility

**File: `functions/utils/rateLimiter.ts`**
```typescript
interface Env {
  DB: D1Database;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export async function checkRateLimit(
  env: Env,
  brandId: string,
  operation: 'try_on' | 'model_gen' | 'measurement'
): Promise<RateLimitResult> {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  // Get brand limits and current usage
  const brand = await env.DB.prepare(`
    SELECT monthly_try_on_limit, current_month_usage, usage_reset_month 
    FROM brands WHERE id = ?
  `).bind(brandId).first() as any;

  if (!brand) {
    return { allowed: false, remaining: 0, resetAt: new Date() };
  }

  // Reset counter if new month
  let currentUsage = brand.current_month_usage || 0;
  if (brand.usage_reset_month !== currentMonth) {
    await env.DB.prepare(`
      UPDATE brands 
      SET current_month_usage = 0, usage_reset_month = ? 
      WHERE id = ?
    `).bind(currentMonth, brandId).run();
    currentUsage = 0;
  }

  const limit = brand.monthly_try_on_limit || 1000;
  const remaining = Math.max(0, limit - currentUsage);

  if (currentUsage >= limit) {
    const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { allowed: false, remaining: 0, resetAt };
  }

  // Increment usage
  await env.DB.prepare(`
    UPDATE brands SET current_month_usage = current_month_usage + 1 WHERE id = ?
  `).bind(brandId).run();

  const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { allowed: true, remaining: remaining - 1, resetAt };
}
```

#### Step 2: Apply Rate Limiting to AI Endpoints

**Update `functions/api/ai/virtual-tryon.ts`:**
```typescript
import { checkRateLimit } from '../../utils/rateLimiter';

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  
  // Extract brand ID (from auth or request)
  const brandId = request.headers.get('X-Brand-Id') || 'default';
  
  // Check rate limit
  const rateLimit = await checkRateLimit(env, brandId, 'try_on');
  
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({
      error: 'Monthly try-on limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      resetAt: rateLimit.resetAt.toISOString(),
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
      }
    });
  }

  // Continue with AI processing...
}
```

#### Step 3: Update Database Schema

Add to `database/schema.sql`:
```sql
-- Add usage tracking columns to brands table
ALTER TABLE brands ADD COLUMN usage_reset_month TEXT;

-- Create usage log table for detailed analytics
CREATE TABLE usage_logs (
    id TEXT PRIMARY KEY,
    brand_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT,
    FOREIGN KEY (brand_id) REFERENCES brands(id)
);

CREATE INDEX idx_usage_logs_brand_date ON usage_logs(brand_id, created_at);
```

---

### 2.2 Remove Demo Data

**Problem:** Hardcoded demo garments in `constants.ts` are mixed with database content.

**Solution:** Remove hardcoded data, use only database.

#### Step 1: Update Catalog Service

**File: `services/catalogService.ts` (updated)**
```typescript
import type { Garment } from '../types';

const API_BASE = '';
let cachedGarments: Garment[] | null = null;

export async function fetchGarments(brandId: string): Promise<Garment[]> {
  try {
    const response = await fetch(`${API_BASE}/api/brands/${brandId}/garments`);
    const data = await response.json();
    
    if (data.success) {
      return data.garments.map((g: any) => ({
        id: g.id,
        name: g.name,
        brand: g.brand_name || 'Unknown',
        bodyPlacement: g.category,
        type: g.type,
        color: g.color,
        description: g.description,
        imageUrl: g.image_url,
        backImageUrl: g.back_image_url,
        sideImageUrl: g.side_image_url,
        sizeChart: JSON.parse(g.size_chart),
        price: g.price,
        currency: g.currency,
      }));
    }
    
    throw new Error(data.error || 'Failed to fetch garments');
  } catch (error) {
    console.error('Error fetching garments:', error);
    return [];
  }
}

export function getGarments(): Garment[] {
  // Return cached garments for sync access (components that need immediate data)
  return cachedGarments || [];
}

export function setGarments(garments: Garment[]) {
  cachedGarments = garments;
}

export function getUpperGarments(): Garment[] {
  return getGarments().filter(g => g.bodyPlacement === 'upper');
}

export function getLowerGarments(): Garment[] {
  return getGarments().filter(g => g.bodyPlacement === 'lower');
}

export function getBrands(): string[] {
  const brands = new Set(getGarments().map(g => g.brand));
  return Array.from(brands);
}

// Remove initializeCatalog() - no longer needed
```

#### Step 2: Delete constants.ts

```bash
rm constants.ts
```

#### Step 3: Update Components to Fetch from API

Update `App.tsx` and components to fetch garments from the database on load.

---

### 2.3 Add Input Validation

**Problem:** API endpoints accept unvalidated input.

**Solution:** Add Zod validation schemas.

#### Step 1: Install Zod (or use manual validation)

Since Cloudflare Workers don't need npm install for runtime, add manual validation:

**File: `functions/utils/validators.ts`**
```typescript
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateGarment(data: any): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!data.name || typeof data.name !== 'string') {
    errors.push('name is required and must be a string');
  } else if (data.name.length < 2 || data.name.length > 100) {
    errors.push('name must be between 2 and 100 characters');
  }

  if (!data.type || typeof data.type !== 'string') {
    errors.push('type is required and must be a string');
  }

  if (!data.bodyPlacement || !['upper', 'lower'].includes(data.bodyPlacement)) {
    errors.push('bodyPlacement must be "upper" or "lower"');
  }

  if (!data.imageUrl || typeof data.imageUrl !== 'string') {
    errors.push('imageUrl is required');
  } else if (!isValidUrl(data.imageUrl) && !data.imageUrl.startsWith('data:image/')) {
    errors.push('imageUrl must be a valid URL or data URI');
  }

  if (!data.sizeChart || typeof data.sizeChart !== 'object') {
    errors.push('sizeChart is required and must be an object');
  }

  // Optional fields validation
  if (data.price !== undefined && (typeof data.price !== 'number' || data.price < 0)) {
    errors.push('price must be a non-negative number');
  }

  if (data.color && typeof data.color !== 'string') {
    errors.push('color must be a string');
  }

  if (data.description && typeof data.description !== 'string') {
    errors.push('description must be a string');
  } else if (data.description && data.description.length > 1000) {
    errors.push('description must be less than 1000 characters');
  }

  return { valid: errors.length === 0, errors };
}

export function validateMeasurements(data: any): ValidationResult {
  const errors: string[] = [];

  const numericFields = ['height', 'weight', 'chest', 'waist'];
  
  for (const field of numericFields) {
    if (data[field] === undefined) {
      errors.push(`${field} is required`);
    } else if (typeof data[field] !== 'number' || data[field] <= 0) {
      errors.push(`${field} must be a positive number`);
    }
  }

  // Sanity checks
  if (data.height && (data.height < 36 || data.height > 96)) {
    errors.push('height must be between 36 and 96 inches');
  }
  if (data.weight && (data.weight < 50 || data.weight > 500)) {
    errors.push('weight must be between 50 and 500 lbs');
  }

  return { valid: errors.length === 0, errors };
}

function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

// Sanitize string input to prevent XSS
export function sanitizeString(str: string): string {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}
```

#### Step 2: Apply Validation in Endpoints

**Update `functions/api/brands/[brandId]/garments.ts`:**
```typescript
import { validateGarment, sanitizeString } from '../../../utils/validators';

export async function onRequestPost(context: { request: Request; env: Env; params: { brandId: string } }) {
  const { request, env, params } = context;
  const { brandId } = params;

  try {
    const garment = await request.json();
    
    // Validate input
    const validation = validateGarment(garment);
    if (!validation.valid) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Validation failed',
        details: validation.errors,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Sanitize string inputs
    const sanitizedGarment = {
      ...garment,
      name: sanitizeString(garment.name),
      description: garment.description ? sanitizeString(garment.description) : null,
      color: garment.color ? sanitizeString(garment.color) : null,
    };

    // Continue with database insert...
  } catch (error) {
    // ...
  }
}
```

---

## 3. Multi-Tenancy Implementation

**Problem:** Frontend is hardcoded to single brand despite multi-tenant database.

**Solution:** Implement URL-based brand routing.

### Step 1: Update App to Support Brand Parameter

**File: `App.tsx` (key changes)**
```typescript
const App: React.FC = () => {
  // ... existing state ...
  const [currentBrandId, setCurrentBrandId] = useState<string | null>(null);
  const [brandInfo, setBrandInfo] = useState<{ name: string; primaryColor: string } | null>(null);

  useEffect(() => {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const brandId = urlParams.get('brandId');
    const garmentId = urlParams.get('garmentId');
    
    if (brandId) {
      setCurrentBrandId(brandId);
      fetchBrandInfo(brandId);
    }
    
    if (garmentId && brandId) {
      // Pre-select garment for direct links from Shopify
      preSelectGarment(brandId, garmentId);
    }
  }, []);

  const fetchBrandInfo = async (brandId: string) => {
    try {
      const response = await fetch(`/api/brands/${brandId}`);
      const data = await response.json();
      if (data.success) {
        setBrandInfo(data.brand);
        // Apply brand's primary color
        document.documentElement.style.setProperty('--primary', data.brand.primaryColor);
      }
    } catch (error) {
      console.error('Failed to fetch brand info:', error);
    }
  };

  // ... rest of component
};
```

### Step 2: Create Brand Info Endpoint

**File: `functions/api/brands/[brandId]/index.ts`**
```typescript
interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: { request: Request; env: Env; params: { brandId: string } }) {
  const { env, params } = context;
  const { brandId } = params;

  try {
    const brand = await env.DB.prepare(`
      SELECT id, name, slug, primary_color, status 
      FROM brands WHERE id = ? AND status != 'suspended'
    `).bind(brandId).first();

    if (!brand) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Brand not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      brand: {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        primaryColor: brand.primary_color,
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch brand'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

### Step 3: Update Garment Selection Component

Pass `brandId` through the component tree and use it when fetching garments.

---

## 4. Production Infrastructure

### 4.1 Add Error Monitoring

**Option: Sentry (Recommended)**

#### Step 1: Install Sentry

```bash
npm install @sentry/react
```

#### Step 2: Initialize in index.tsx

```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  tracesSampleRate: 0.1, // 10% of transactions
  replaysSessionSampleRate: 0.1,
});

// Wrap App with error boundary
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
    <App />
  </Sentry.ErrorBoundary>
);
```

### 4.2 Add Logging for Workers

**File: `functions/utils/logger.ts`**
```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
}

export function log(level: LogLevel, message: string, context?: Record<string, any>) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  };

  // In production, you might send this to a logging service
  // For now, use console with structured output
  const logFn = level === 'error' ? console.error : 
                level === 'warn' ? console.warn : console.log;
  
  logFn(JSON.stringify(entry));
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, any>) => log('debug', msg, ctx),
  info: (msg: string, ctx?: Record<string, any>) => log('info', msg, ctx),
  warn: (msg: string, ctx?: Record<string, any>) => log('warn', msg, ctx),
  error: (msg: string, ctx?: Record<string, any>) => log('error', msg, ctx),
};
```

---

## 5. Code Quality Improvements

### 5.1 Fix TypeScript Types

Replace `any` types with proper interfaces:

**File: `types.ts` (additions)**
```typescript
// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// Garment API types
export interface ApiGarment {
  id: string;
  brand_id: string;
  name: string;
  type: string;
  category: 'upper' | 'lower';
  color: string | null;
  description: string | null;
  image_url: string;
  back_image_url: string | null;
  side_image_url: string | null;
  price: number;
  currency: string;
  size_chart: string; // JSON string
  active: number;
  created_at: string;
}

// Brand types
export interface Brand {
  id: string;
  name: string;
  slug: string;
  primaryColor: string;
  status: 'trial' | 'active' | 'suspended';
  plan: 'basic' | 'pro' | 'enterprise';
}

// Request body types
export interface CreateGarmentRequest {
  name: string;
  type: string;
  bodyPlacement: 'upper' | 'lower';
  color?: string;
  description?: string;
  imageUrl: string;
  backImageUrl?: string;
  sideImageUrl?: string;
  sizeChart: SizeChart;
  price?: number;
  currency?: string;
}
```

### 5.2 Clean Up Codebase

```bash
# Remove backup and unused files
rm components/admin/GarmentForm.tsx.backup
rm Untitled
rm UploadStep.tsx  # Duplicate at root level (keep components/UploadStep.tsx)
```

---

## 6. Implementation Checklist

Use this checklist to track progress:

### Phase 1: Critical Security (Do First!)
- [ ] Create AI proxy Worker endpoints
- [ ] Move Gemini API key to Cloudflare secrets
- [ ] Update frontend to use proxy endpoints
- [ ] Remove VITE_GEMINI_API_KEY from .env
- [ ] Implement API authentication middleware
- [ ] Create API key validation endpoint
- [ ] Update admin login to use API keys
- [ ] Remove hardcoded credentials from LoginPage.tsx

### Phase 2: High Priority
- [ ] Add rate limiting utility
- [ ] Apply rate limiting to AI endpoints
- [ ] Update database schema for usage tracking
- [ ] Remove constants.ts (demo data)
- [ ] Update catalogService to fetch from API only
- [ ] Add input validation utility
- [ ] Apply validation to all POST/PUT endpoints

### Phase 3: Multi-Tenancy
- [ ] Add URL parameter parsing in App.tsx
- [ ] Create brand info endpoint
- [ ] Update components to use dynamic brandId
- [ ] Test with multiple brands in database

### Phase 4: Production Polish
- [ ] Set up Sentry error monitoring
- [ ] Add structured logging to Workers
- [ ] Clean up unused files
- [ ] Fix TypeScript any types
- [ ] Add basic unit tests for validators

### Phase 5: Testing
- [ ] Test all API endpoints with authentication
- [ ] Test rate limiting behavior
- [ ] Test multi-brand scenarios
- [ ] Test error handling flows
- [ ] Load test AI endpoints

---

## Environment Variables Reference

### Cloudflare Secrets (set via CLI)
```bash
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put ADMIN_SECRET
```

### wrangler.toml Variables
```toml
[vars]
ENVIRONMENT = "production"
ALLOWED_ORIGINS = "https://yourdomain.com"
```

### Local Development (.dev.vars)
```
GEMINI_API_KEY=your_key_here
ADMIN_SECRET=your_admin_secret
```

---

## Estimated Implementation Time

| Phase | Tasks | Estimated Effort |
|-------|-------|------------------|
| Phase 1 | Critical Security | 2-3 days |
| Phase 2 | High Priority | 1-2 days |
| Phase 3 | Multi-Tenancy | 1 day |
| Phase 4 | Production Polish | 1 day |
| Phase 5 | Testing | 1-2 days |
| **Total** | | **6-10 days** |

---

## Questions or Issues?

If you encounter issues during implementation, common problems include:

1. **CORS errors**: Ensure all endpoints return proper CORS headers
2. **D1 binding errors**: Verify wrangler.toml database binding matches
3. **Secret not found**: Run `wrangler secret put` for each secret
4. **Type errors**: Ensure all types are properly imported

---

*Document maintained by the Style Sync development team.*
