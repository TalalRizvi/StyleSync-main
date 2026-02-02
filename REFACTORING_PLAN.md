# Style Sync Refactoring Plan

## Overview
Transform the app from a general try-on platform to a brand-exclusive, cost-optimized virtual try-on solution.

## Key Changes

### 1. Brand-Specific Workflow
**Goal:** Allow brands to embed "Try On" buttons that direct users to a brand-exclusive experience.

**Changes:**
- Accept URL parameters: `?brandId=xxx&garmentId=xxx`
- Pre-populate brand and garment from URL
- Filter all garment selections to only show the specified brand's products
- Skip brand selection step when coming from brand link
- Allow browsing other garments from the same brand after initial try-on

**URL Format:**
```
https://your-app.com/?brandId=brand_streetstar_001&garmentId=gmt_ss_tshirt_001
```

### 2. Remove Model Generation Step
**Goal:** Reduce costs by eliminating the initial model generation API call.

**Changes:**
- Remove `MODEL_GENERATION` state from AppState enum
- Skip model generation step in workflow
- Use original `userImage` directly in `virtualTryOn` function instead of `modelImage`
- Update `ResultsStep` to accept `userImage` instead of `modelImage`
- Remove `ModelGenerationStep` component (or keep for backward compatibility)
- Update `geminiService.ts` to work with original photo

**Cost Impact:** 
- Eliminates 1 Gemini API call per session (model generation)
- Saves ~$0.01-0.02 per user session

### 3. Simplify Pose Selection
**Goal:** Reduce costs and complexity by keeping only essential poses.

**Changes:**
- Remove poses: `3/4`, `Side`, `Walking`, `Jumping`, `Leaning`
- Keep only: `Front` and `Back`
- Update `ResultsStep.tsx` to only show Front/Back pose buttons
- Update pose descriptions in `Poses` object

**Cost Impact:**
- Reduces potential API calls from 7 poses to 2 poses
- Users can still regenerate, but fewer options = less usage

## New Workflow

### Flow 1: Direct from Brand Website (Primary)
1. **URL with params** → Brand & Garment pre-selected
2. **Upload** → User uploads photo
3. **Measurements** → Auto-estimate or manual entry
4. **Results** → Direct to try-on with pre-selected garment
5. **Browse More** → User can try other garments from same brand

### Flow 2: Standalone App (Secondary)
1. **Upload** → User uploads photo
2. **Measurements** → Auto-estimate or manual entry
3. **Garment Type Selection** → Upper or Lower
4. **Brand Selection** → Select brand (or Custom)
5. **Garment Selection** → Choose specific garment
6. **Results** → Try-on with selected garment

## Implementation Plan

### Phase 1: URL Parameter Handling
- [ ] Add URL parameter parsing in `App.tsx`
- [ ] Create function to fetch garment by ID from API
- [ ] Pre-populate state from URL params
- [ ] Add brand context throughout app

### Phase 2: Remove Model Generation
- [ ] Update `AppState` enum (remove `MODEL_GENERATION`)
- [ ] Update `App.tsx` workflow to skip model generation
- [ ] Modify `ResultsStep` to use `userImage` instead of `modelImage`
- [ ] Update `virtualTryOn` to work with original photo
- [ ] Update `StepIndicator` to reflect new steps

### Phase 3: Simplify Poses
- [ ] Update `Poses` object in `ResultsStep.tsx`
- [ ] Remove unused pose icons/components
- [ ] Update UI to show only Front/Back buttons

### Phase 4: Brand Filtering
- [ ] Update `GarmentSelectionStep` to filter by brand
- [ ] Update `BrandSelectionStep` to skip if brand pre-selected
- [ ] Add "Browse More" functionality in Results
- [ ] Update API service to fetch by brand ID

### Phase 5: Testing & Refinement
- [ ] Test brand-specific flow
- [ ] Test standalone flow
- [ ] Verify cost reduction
- [ ] Update documentation

## File Changes Summary

### Files to Modify:
1. **App.tsx** - Main workflow logic, URL parsing, state management
2. **types.ts** - Update AppState enum
3. **ResultsStep.tsx** - Use userImage, simplify poses
4. **StepIndicator.tsx** - Update step names
5. **GarmentSelectionStep.tsx** - Brand filtering
6. **BrandSelectionStep.tsx** - Conditional rendering
7. **adminApiService.ts** - Add getGarmentById function
8. **geminiService.ts** - Update virtualTryOn to work with original photo

### Files to Remove/Deprecate:
1. **ModelGenerationStep.tsx** - No longer needed (or keep for fallback)

## API Changes Needed

### New Endpoint (if needed):
```
GET /api/brands/:brandId/garments/:garmentId
```

### Existing Endpoints (verify):
- `GET /api/brands/:brandId/garments` - Already exists ✓

## Database Considerations
- No schema changes needed
- Ensure brand filtering works correctly
- Verify garment lookup by ID

## Cost Analysis

### Before:
- Model Generation: 1 call × $0.01 = $0.01
- Measurement Estimation: 1 call × $0.001 = $0.001
- Size Recommendation: 1-2 calls × $0.001 = $0.001-0.002
- Virtual Try-On: 1-7 calls × $0.01 = $0.01-0.07
- **Total per session: ~$0.022-0.083**

### After:
- ~~Model Generation: REMOVED~~ = $0.00
- Measurement Estimation: 1 call × $0.001 = $0.001
- Size Recommendation: 1-2 calls × $0.001 = $0.001-0.002
- Virtual Try-On: 1-2 calls × $0.01 = $0.01-0.02
- **Total per session: ~$0.012-0.023**

### Savings: ~45-72% reduction in API costs

## Migration Strategy
1. Keep backup of current version
2. Implement changes incrementally
3. Test each phase before moving to next
4. Deploy to staging first
5. Monitor costs and user experience

## Questions to Consider
1. Should we keep model generation as an optional feature?
2. Do we need backward compatibility for existing users?
3. How should we handle invalid brandId/garmentId in URL?
4. Should we add analytics to track brand-specific usage?

