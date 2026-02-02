# Shopify Integration Plan for Street Star

## Current Status: ⚠️ NOT READY (But Close!)

### What's Working ✅
- ✅ Database has `shopify_product_id` field
- ✅ API endpoint to list garments by brand: `/api/brands/:brandId/garments`
- ✅ API endpoint to update/delete garment: `/api/brands/:brandId/garments/:garmentId`
- ✅ Brand ID exists: `brand_streetstar_001`
- ✅ App is deployed and accessible

### What's Missing ❌
- ❌ **NO GET endpoint for single garment by ID** (needed for URL params)
- ❌ **App doesn't read URL parameters** (brandId, garmentId)
- ❌ **App still uses localStorage** instead of API
- ❌ **Model generation step still exists** (adds cost)
- ❌ **Too many poses** (adds cost)
- ❌ **No Shopify button code** to embed

---

## Integration Requirements

### 1. API Endpoint: Get Single Garment
**Missing:** `GET /api/brands/:brandId/garments/:garmentId`

**Needed for:** Fetching specific garment when user clicks "Try On" button

### 2. URL Parameter Handling
**Missing:** App doesn't read `?brandId=xxx&garmentId=xxx` from URL

**Needed for:** Pre-selecting garment when coming from Shopify

### 3. Remove Model Generation
**Current:** Upload → Model Generation → Measurements → ...

**Needed:** Upload → Measurements → Results (direct)

**Why:** Saves ~$0.01 per session, faster UX

### 4. Simplify Poses
**Current:** 7 poses (Front, 3/4, Side, Back, Walking, Jumping, Leaning)

**Needed:** 2 poses (Front, Back)

**Why:** Reduces API calls, saves cost

### 5. Shopify Integration Code
**Missing:** Button code to embed in Shopify product pages

**Needed:** HTML/JavaScript snippet for Street Star to add to their theme

---

## Implementation Checklist

### Phase 1: API & Backend (30 min)
- [ ] Add `GET /api/brands/:brandId/garments/:garmentId` endpoint
- [ ] Test endpoint with Street Star's brand ID

### Phase 2: Frontend - URL Parameters (1 hour)
- [ ] Parse URL parameters on app load
- [ ] Fetch garment from API if `garmentId` exists
- [ ] Pre-populate garment selection
- [ ] Skip brand selection if `brandId` exists

### Phase 3: Frontend - Remove Model Generation (1 hour)
- [ ] Remove `MODEL_GENERATION` from AppState
- [ ] Update workflow: Upload → Measurements → Results
- [ ] Use `userImage` directly in `virtualTryOn`
- [ ] Update `StepIndicator` component

### Phase 4: Frontend - Simplify Poses (30 min)
- [ ] Remove unused poses from `ResultsStep.tsx`
- [ ] Keep only Front and Back
- [ ] Update pose selection UI

### Phase 5: Shopify Integration (1 hour)
- [ ] Create Shopify button code snippet
- [ ] Map Shopify product ID to garment ID
- [ ] Test integration on Street Star's site
- [ ] Create integration documentation

---

## Shopify Integration Flow

### Step 1: Street Star Adds Products to Your Database
1. Street Star logs into admin panel
2. Adds garments with `shopify_product_id` field
3. Each garment gets a unique `garment_id` in your database

### Step 2: Street Star Adds Button to Shopify
Add this code to their product page template:

```liquid
{% comment %} Add this to product.liquid or product-form.liquid {% endcomment %}
<button 
  id="style-sync-try-on-btn"
  data-brand-id="brand_streetstar_001"
  data-garment-id="{{ product.metafields.style_sync.garment_id }}"
  class="style-sync-button"
>
  Try It On
</button>

<script>
document.getElementById('style-sync-try-on-btn').addEventListener('click', function() {
  const brandId = this.dataset.brandId;
  const garmentId = this.dataset.garmentId;
  const tryOnUrl = `https://f2a76211.style-sync.pages.dev/?brandId=${brandId}&garmentId=${garmentId}`;
  window.open(tryOnUrl, '_blank', 'width=1200,height=800');
});
</script>
```

### Step 3: User Experience
1. User browses Street Star's Shopify site
2. Clicks "Try It On" button on product page
3. New window opens with your app
4. Garment is pre-selected
5. User uploads photo → Measurements → See try-on result
6. User can browse other Street Star garments

---

## Database Mapping

### Option A: Use Shopify Product ID (Recommended)
Store Shopify product ID in your database:
```sql
UPDATE garments 
SET shopify_product_id = '123456789' 
WHERE id = 'gmt_ss_tshirt_001';
```

Then in Shopify, use:
```liquid
data-garment-id="{{ product.id }}"
```

And query your database by `shopify_product_id`.

### Option B: Use Metafields
Store your garment ID in Shopify product metafields:
```liquid
data-garment-id="{{ product.metafields.style_sync.garment_id }}"
```

---

## Quick Start: What to Do NOW

### Immediate Actions (Today):

1. **Add GET endpoint for single garment**
   - File: `functions/api/brands/[brandId]/garments/[garmentId].ts`
   - Add `onRequestGet` function

2. **Make app read URL parameters**
   - File: `App.tsx`
   - Parse `?brandId=xxx&garmentId=xxx` on mount

3. **Remove model generation step**
   - Update `App.tsx` workflow
   - Use `userImage` directly

4. **Create Shopify button code**
   - Simple HTML/JS snippet
   - Test on Street Star's site

### Testing Checklist:
- [ ] Test URL: `https://f2a76211.style-sync.pages.dev/?brandId=brand_streetstar_001&garmentId=gmt_ss_tshirt_001`
- [ ] Verify garment loads automatically
- [ ] Verify brand filtering works
- [ ] Test on Street Star's Shopify site
- [ ] Verify try-on works end-to-end

---

## Timeline Estimate

**Total Time: ~4 hours**

- Phase 1 (API): 30 min
- Phase 2 (URL params): 1 hour
- Phase 3 (Remove model gen): 1 hour
- Phase 4 (Simplify poses): 30 min
- Phase 5 (Shopify code): 1 hour
- Testing: 1 hour

**Can be done today if we start now!**

---

## Questions for Street Star

Before integration, confirm:

1. **Product Mapping:**
   - How do we map Shopify products to your garments?
   - Do they have product IDs we can use?
   - Or should we use product handles/slugs?

2. **Button Placement:**
   - Where should the "Try On" button appear?
   - Product page? Cart? Checkout?
   - What should it look like? (we can style it)

3. **New Products:**
   - When they add products tomorrow, how do we sync?
   - Manual via admin panel?
   - Or automated via Shopify API?

4. **Branding:**
   - Should the app show Street Star branding?
   - Use their colors/logo?
   - Or generic Style Sync branding?

---

## Next Steps

1. ✅ Review this plan
2. ✅ Confirm approach with Street Star
3. ✅ Implement missing features (4 hours)
4. ✅ Test integration
5. ✅ Deploy to production
6. ✅ Add button to Street Star's Shopify site
7. ✅ Monitor and iterate

---

## Files to Modify

1. `functions/api/brands/[brandId]/garments/[garmentId].ts` - Add GET endpoint
2. `App.tsx` - URL parsing, remove model generation
3. `ResultsStep.tsx` - Simplify poses, use userImage
4. `StepIndicator.tsx` - Update steps
5. `services/adminApiService.ts` - Add getGarmentById function
6. Create: `SHOPIFY_INTEGRATION.md` - Button code and docs

