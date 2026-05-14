# Audit Note — AIProductPhotoEnhancer

Source: `/Users/erolakarsu/projects/_AUDIT/reports/batch_06.md` section #36.

## Original Recommendations
TSV said `0 AI endpoints`, but on inspection **most recommended endpoints already exist** as resource-scoped routes:

- `backgroundRemoval.js` — has `POST /:id/analyze`
- `sizeRecommender.js` — has `POST /:id/analyze`
- `colorAnalysis.js` — has `POST /:id/analyze`
- `returnPredictor.js` — has `POST /:id/analyze`
- `qualityAssessment.js`, `lifestyleShots.js`, `giftSuggester.js`, `productDescription.js`, `enhancements.js`, `sizeReference.js`, `photos.js`, `view360.js` — all use `OpenRouterService`.

The audit's "0 AI endpoints" verdict is wrong because endpoints follow `/:id/analyze` pattern under each resource rather than `/api/ai/...`.

### Custom Feature Suggestions
1. AI photo enhancement pipeline (already covered)
2. Computer-vision sizing (already covered)
3. Return-risk prediction (already covered)
4. Multi-variant generation (already covered partially)
5. Competitive visual intelligence

## Implemented (Mechanical)
- None added. All audit-recommended AI endpoints already exist; adding a flat `/api/ai/*` alias router would risk breaking existing client paths.

## Backlog (deferred)

### NEEDS-PRODUCT-DECISION
- Surface a flat `/api/ai/remove-background`, `/api/ai/recommend-size`, `/api/ai/predict-return` alias router for clients that expect that shape — small change but unverified client compatibility.
- Multi-variant generation orchestrator (combines lifestyle + background + description in one call).
- Competitive visual intelligence (compare uploaded competitor photos).

### NEEDS-CREDS / NEW-DEPS
- Shopify/WooCommerce integration.
- Image CDN (Cloudinary, AWS CloudFront).
- Background-removal model upgrade (remove.bg, Adobe Sensei).

### TOO-RISKY
- Auto-publishing enhanced photos to e-commerce stores (requires write access).
- Batch processing pipeline (queue + storage scope).

## Audit Re-categorization
The verdict should be **"substantive (resource-scoped AI)"** not "template-clone". Future audits should look for `services/openrouter*` usage across resource routes, not just an `ai.js` file.

## Apply pass 4 (mechanical backlog)

- Verdict: **LEFT-AS-IS**.
- All open backlog items are NEEDS-PRODUCT-DECISION (flat `/api/ai/*` alias router, multi-variant orchestrator, competitive visual intelligence), NEEDS-CREDS / NEW-DEPS (Shopify, CDN, premium image-API upgrades), or TOO-RISKY (auto-publish, batch pipeline). No mechanical AI items remain.
- No BE / FE changes.

## Apply pass 3 (frontend)

- Verdict: **LEFT-AS-IS**.
- Stack: React+Vite. JWT Bearer auth from `localStorage` is handled in the existing API service; pages render AI results via shared `AIResultDisplay` and `ImageUpload` components.
- `App.jsx` already registers a route per AI surface: `/background-removal`, `/enhancements`, `/lifestyle-shots`, `/color-analysis`, `/quality-assessment`, `/product-descriptions`, `/size-reference`, `/view-360`, `/size-recommender`, `/gift-suggester`, `/return-predictor`, `/photo-analysis`, `/batch-analysis`.
- No FE changes were needed (idempotent skip).
