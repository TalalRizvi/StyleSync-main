# Architecture Options: Multi-Tenancy Strategy

## Current Setup Analysis

✅ **Your database is already multi-tenant:**
- `brands` table stores all brands
- `garments` table has `brand_id` foreign key
- API endpoint `/api/brands/:brandId/garments` filters by brand
- All brands share the same database

✅ **Your API is already brand-aware:**
- Endpoints accept `brandId` parameter
- Queries filter by `brand_id`

❌ **Your frontend is NOT brand-aware yet:**
- Currently uses `localStorage` with hardcoded garments
- `adminApiService.ts` has hardcoded `BRAND_ID = 'brand_streetstar_001'`
- No URL parameter handling

---

## Option 1: Single Multi-Tenant App (RECOMMENDED) ⭐

### How It Works:
- **One codebase, one deployment, one database**
- URL parameters determine which brand's catalog to show
- All brands share the same app instance

### Example URLs:
```
https://style-sync.pages.dev/                    → Demo/Standalone mode
https://style-sync.pages.dev/?brandId=brand_streetstar_001&garmentId=gmt_ss_tshirt_001  → Street Star
https://style-sync.pages.dev/?brandId=brand_nike_001&garmentId=gmt_nike_shirt_001      → Nike
```

### Implementation:
1. Parse URL parameters on app load
2. Fetch garments from API: `/api/brands/{brandId}/garments`
3. Filter all UI to show only that brand's products
4. If no `brandId` in URL → show demo/standalone mode

### Pros:
✅ **Single codebase** - Easy to maintain and update
✅ **Single deployment** - Deploy once, all brands benefit
✅ **Cost efficient** - One Cloudflare Pages project
✅ **Easy onboarding** - Just add brand to database, no deployment needed
✅ **Shared improvements** - Bug fixes/features benefit all brands
✅ **Centralized analytics** - Track all brands in one place

### Cons:
❌ **Less customization** - Harder to customize per brand (but possible with brand config)
❌ **Shared domain** - All brands use same URL (can use subdomains if needed)

### Brand Customization (if needed):
- Store brand config in `brands` table (logo, colors, theme)
- Load config on app init based on `brandId`
- Apply brand-specific styling

---

## Option 2: Separate Deployments per Brand

### How It Works:
- **One codebase, multiple deployments**
- Each brand gets their own Cloudflare Pages project
- Each deployment has different `wrangler.toml` config
- All share the same database

### Example URLs:
```
https://streetstar.style-sync.pages.dev/         → Street Star
https://nike.style-sync.pages.dev/              → Nike
https://demo.style-sync.pages.dev/              → Demo
```

### Implementation:
1. Create separate Cloudflare Pages projects per brand
2. Each `wrangler.toml` has different `name` and environment variables
3. Hardcode `BRAND_ID` in each deployment's config
4. Deploy same codebase to multiple projects

### Pros:
✅ **Complete isolation** - Each brand has separate deployment
✅ **Custom domains** - Each brand can have their own domain
✅ **Independent scaling** - Can scale brands separately
✅ **Brand-specific customization** - Easier to customize per brand

### Cons:
❌ **Multiple deployments** - Must deploy to each project separately
❌ **Code duplication** - Same code in multiple places (or complex CI/CD)
❌ **More maintenance** - Updates must be deployed to all projects
❌ **Higher costs** - Multiple Cloudflare Pages projects (if on paid plan)
❌ **Complex CI/CD** - Need automation to deploy to all projects

---

## Option 3: Hybrid Approach

### How It Works:
- **Keep demo app separate**
- **Create brand-specific deployments for major brands**
- **Use single app for smaller brands**

### Example:
```
https://style-sync.pages.dev/                    → Demo (standalone)
https://streetstar.style-sync.pages.dev/         → Street Star (dedicated)
https://nike.style-sync.pages.dev/              → Nike (dedicated)
https://style-sync.pages.dev/?brandId=small_brand_001  → Small Brand (shared)
```

### Pros:
✅ **Flexibility** - Best of both worlds
✅ **Major brands get dedicated experience**
✅ **Small brands share infrastructure**

### Cons:
❌ **Most complex** - Need to manage both approaches
❌ **Inconsistent** - Different experiences for different brands

---

## Recommendation: Option 1 (Single Multi-Tenant App)

### Why?
1. **Your database is already set up for it** ✅
2. **Your API already supports it** ✅
3. **Simplest to maintain** ✅
4. **Cost effective** ✅
5. **Easy to scale** ✅

### Implementation Plan:

#### Step 1: Make Frontend Brand-Aware
```typescript
// App.tsx - Parse URL on mount
const urlParams = new URLSearchParams(window.location.search);
const brandId = urlParams.get('brandId');
const garmentId = urlParams.get('garmentId');

// If brandId exists, fetch from API
if (brandId) {
  const garments = await getGarmentsFromAPI(brandId);
  // Filter UI to show only this brand
}
```

#### Step 2: Update API Service
```typescript
// adminApiService.ts - Make brandId dynamic
export async function getGarments(brandId?: string): Promise<any[]> {
  const targetBrandId = brandId || getBrandIdFromURL() || BRAND_ID;
  const response = await fetch(`${API_BASE_URL}/api/brands/${targetBrandId}/garments`);
  // ...
}
```

#### Step 3: Brand Configuration (Optional)
```sql
-- Use existing brands table columns:
-- primary_color, name, slug for branding
```

### Brand Onboarding Process:
1. Add brand to database via admin panel
2. Add garments via admin panel
3. Give brand their try-on URL: `https://style-sync.pages.dev/?brandId=brand_xxx&garmentId=gmt_xxx`
4. **Done!** No deployment needed.

---

## Comparison Table

| Feature | Option 1: Single App | Option 2: Separate Deployments | Option 3: Hybrid |
|---------|---------------------|-------------------------------|------------------|
| **Codebase** | 1 | 1 (multiple deployments) | 1 |
| **Deployments** | 1 | N (one per brand) | 1 + N |
| **Maintenance** | Easy | Complex | Medium |
| **Cost** | Low | Medium-High | Medium |
| **Customization** | Medium | High | High |
| **Onboarding** | Instant | Requires deployment | Mixed |
| **Scalability** | High | Medium | High |
| **Isolation** | Low | High | Mixed |

---

## Decision Matrix

Choose **Option 1** if:
- ✅ You want simple maintenance
- ✅ You want cost efficiency
- ✅ You want fast brand onboarding
- ✅ Brand-specific customization isn't critical
- ✅ You're okay with shared domain/subdomain

Choose **Option 2** if:
- ✅ Brands need complete isolation
- ✅ Each brand needs custom domain
- ✅ You have resources for multiple deployments
- ✅ Brand-specific customization is critical

Choose **Option 3** if:
- ✅ You have a mix of major and minor brands
- ✅ You want flexibility
- ✅ You can manage complexity

---

## My Recommendation

**Go with Option 1 (Single Multi-Tenant App)** because:

1. Your infrastructure is already set up for it
2. You can always migrate to Option 2 later if needed
3. Start simple, scale when necessary
4. Most SaaS platforms use this approach (Shopify, Stripe, etc.)

### Next Steps:
1. Implement URL parameter parsing
2. Make API calls brand-aware
3. Test with multiple brands
4. If needed later, you can create separate deployments for major brands

---

## Questions to Consider:

1. **Do brands need their own domain?**
   - If yes → Option 2 or custom domains with Option 1
   - If no → Option 1 is perfect

2. **Do brands need different UI/UX?**
   - If yes → Option 2 or brand config in Option 1
   - If no → Option 1 is perfect

3. **How many brands do you expect?**
   - < 10 → Option 1
   - 10-50 → Option 1 or Option 3
   - 50+ → Option 1 (most scalable)

4. **Do you have resources for multiple deployments?**
   - Limited → Option 1
   - Plenty → Option 2 or 3

