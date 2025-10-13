# Custom Bundle Builder Implementation

## Overview
This document describes the custom bundle builder implementation for the Power Cookie product at planetamino.com/products/power-cookie.

## What Was Implemented

### 1. Files Created

#### `snippets/custom-bundle-builder.liquid`
- Reusable Liquid snippet that renders the bundle builder UI
- Fetches Power Cookie products from the 'power-cookie' collection
- Loops through all variants of each product to display individual flavors
- Displays variants in a responsive 2-column grid (mobile and desktop)
- Uses variant-specific images when available, falls back to product image
- Includes subscription toggle and dynamic pricing display
- Each flavor card shows: variant image, variant name, dynamic price, and Add button/quantity selector

#### `assets/custom-bundle-builder.js`
- JavaScript module for bundle builder functionality
- **State Management**: Tracks selected flavors and quantities
- **UI Interactions**: 
  - Toggles between "Add" button and quantity selector
  - Updates pricing in real-time
  - Enables/disables add to cart button
- **Pricing Logic**:
  - Tiered pricing: 5-19 cookies (€2.79), 20-39 (€2.49), 40+ (€2.29)
  - Subscription discount fetched from Seal Subscriptions
  - Shows savings prompt for next tier
- **Cart Integration**:
  - Compatible with UpCart and default Shopify cart
  - Uses FormData for cart API calls
  - Handles cart drawer updates
  - Includes bundle properties for tracking

#### `assets/custom-bundle-builder.css`
- Complete styling for the bundle builder
- 2-column grid on all screen sizes
- Responsive design with mobile optimizations
- Styled components:
  - Flavor cards with hover effects
  - Quantity selectors
  - Subscription toggle with radio buttons
  - Pricing summary section
  - Add to cart button with states

### 2. Files Modified

#### `templates/product.power-cookie-custom-box.json`
- Added custom bundle builder block
- Disabled original bundler shortcode (kept for backward compatibility)
- Updated block order to show custom builder

#### `locales/en.default.json`
Added translation keys:
- `bundles.add_button`: "Add"
- `bundles.add_more_save`: "Add {count} more to save €{amount}/cookie"
- `bundles.cookies_in_box`: "Cookies in box"
- `bundles.no_products`: "No products available"

#### `locales/fi.json`
Added Finnish translations:
- `bundles.add_button`: "Lisää"
- `bundles.add_more_save`: "Lisää {count} lisää ja säästä €{amount}/keksi"
- `bundles.cookies_in_box`: "Keksejä laatikossa"
- `bundles.no_products`: "Ei tuotteita saatavilla"

## Key Features

### Dynamic Pricing (Fully Dynamic & Reusable)
- **Fetches actual prices from Shopify product variants** (not hardcoded)
- **Fetches bulk discount tiers** from product metafields or uses configurable defaults
- **Fetches subscription discount** from Seal Subscriptions app dynamically
- Calculates individual item prices with bulk + subscription discounts
- Calculates grand total with bulk + subscription discounts
- Shows original price and discounted price
- Updates prices in real-time as quantity changes

### Subscription Integration
- Reads subscription discount percentage from Seal Subscriptions widget
- Dynamically updates "SAVE X%" badge
- Includes selling plan ID when adding to cart
- Compatible with Seal Subscriptions app

### User Experience
- Clean two-column grid layout matching design specs
- Smooth transitions between states
- "Add" button transforms into quantity selector
- Real-time price updates
- Visual feedback for quantity changes
- Responsive on all screen sizes

### Cart Integration
- Compatible with UpCart and default Shopify cart drawer
- Handles cart updates and notifications
- Opens cart drawer after successful add
- Includes error handling and retry logic
- Uses FormData for maximum compatibility

## Configuration

### Bulk Discount Tiers (Dynamic)

The bundle builder supports **fully dynamic bulk discount configuration** with 3 priority levels:

#### Priority Order
1. **Template Parameter** (recommended for reuse) → Highest priority
2. **Product Metafield** (per-product override) → Medium priority  
3. **Snippet Default** (global fallback) → Lowest priority

#### Option 1: Product Template (✅ RECOMMENDED - Easy to Reuse)
Configure directly in the product template where you render the snippet:

**Edit**: `templates/product.power-cookie-custom-box.json`
```liquid
{% render 'custom-bundle-builder', 
  product: product, 
  collection_handle: 'power-cookie',
  bulk_discounts: '5:0,20:10,40:20' 
%}
```

**To reuse on another product**: Just copy this snippet and update the `collection_handle` and `bulk_discounts` values!

**Format**: `'minQty:discountPercent,minQty:discountPercent'`
- Example: `'5:0,20:10,40:20'` means:
  - 5-19 items = 0% off
  - 20-39 items = 10% off
  - 40+ items = 20% off

#### Option 2: Product Metafields (For per-product overrides)
Override template settings for specific products:

1. Go to Shopify Admin → Settings → Custom data → Products
2. Create a metafield:
   - **Namespace and key**: `custom.bulk_discounts`
   - **Type**: Single line text
   - **Value**: Same format as above (e.g., `5:0,20:10,40:20`)

#### Option 3: Edit Default in Snippet (Global fallback)
Edit `snippets/custom-bundle-builder.liquid`, line 33:
```liquid
assign bulk_discounts = "5:0,20:10,40:18"
```

#### How It Works
- Bulk discounts are **percentage-based** (applied to Shopify variant prices)
- Configurable at 3 levels for maximum flexibility
- JavaScript automatically parses and applies the configuration

### Subscription Discount (Dynamic)
- **Fetched automatically** from Seal Subscriptions app
- Can be overridden per product using metafield:
  - **Namespace and key**: `custom.subscription_discount`
  - **Type**: Number (integer)
  - **Value**: Percentage (e.g., `10` for 10% off)

### Minimum Items
Edit `CONFIG.minItems` in `assets/custom-bundle-builder.js`:
```javascript
minItems: 1  // Change to require minimum items
```

### Collection Source (Fully Configurable)
The bundle builder fetches products from a Shopify collection. You can configure which collection to use:

#### Via Template Parameter (✅ RECOMMENDED)
Pass the collection handle when rendering the snippet:
```liquid
{% render 'custom-bundle-builder', 
  product: product, 
  collection_handle: 'your-collection-handle',
  bulk_discounts: '5:0,20:10,40:20' 
%}
```

#### Via Snippet Default (Fallback)
If no `collection_handle` parameter is provided, edit the default in `snippets/custom-bundle-builder.liquid`, line 19:
```liquid
assign collection_handle = 'power-cookie'
```

**How it works:**
- The builder fetches all products and variants from the specified collection
- Uses each variant's Shopify price automatically
- Applies the configured bulk discounts
- Applies subscription discount from Seal Subscriptions

## Pricing Calculation Logic

The bundle builder now uses a fully dynamic pricing system:

### 1. Individual Item Prices (Add Button)
When displaying the price on each "Add" button:
1. Start with **Shopify variant price** (fetched from product data)
2. Apply **bulk discount** based on current total quantity + 1
   - Example: If currently 19 items, next item gets discount for 20+ tier
3. Apply **subscription discount** if subscription is selected
4. **Formula**: `FinalPrice = ShopifyPrice × (1 - BulkDiscount%) × (1 - SubscriptionDiscount%)`

### 2. Grand Total
When calculating the bundle total:
1. Sum all selected items using their **actual Shopify variant prices**
2. Apply **bulk discount** to the subtotal based on total quantity
3. Apply **subscription discount** to the result if subscription is selected
4. **Formula**: `Total = (Σ ShopifyPrices) × (1 - BulkDiscount%) × (1 - SubscriptionDiscount%)`

### Example
- **Variant Price**: €2.79
- **Quantity**: 25 items (qualifies for 10% bulk discount)
- **Subscription**: Selected (10% subscription discount)

**Calculation**:
1. Subtotal: 25 × €2.79 = €69.75
2. After bulk discount (10%): €69.75 × 0.90 = €62.78
3. After subscription (10%): €62.78 × 0.90 = €56.50
4. **Final Total**: €56.50

**Individual Price**:
- Base: €2.79
- After bulk (10%): €2.79 × 0.90 = €2.51
- After subscription (10%): €2.51 × 0.90 = €2.26

## Testing Checklist

### Functionality
- [ ] Flavor cards load correctly from collection
- [ ] Prices display correctly for each flavor (from Shopify)
- [ ] "Add" button appears initially with correct base price
- [ ] Clicking "Add" shows quantity selector with quantity 1
- [ ] Quantity +/- buttons work correctly
- [ ] Quantity returns to "Add" button when set to 0
- [ ] Total quantity updates in real-time
- [ ] Total price calculates correctly with Shopify prices

### Dynamic Pricing
- [ ] **Bulk discounts** apply at correct thresholds (default: 5, 20, 40)
- [ ] **Add button prices** update when quantity changes
- [ ] **Add button prices** reflect bulk discount based on total quantity
- [ ] **Add button prices** reflect subscription discount when selected
- [ ] **Grand total** uses actual Shopify variant prices
- [ ] **Grand total** applies bulk discount correctly
- [ ] **Grand total** applies subscription discount correctly
- [ ] **Original price** shows when discounts are applied
- [ ] "Add X more to save Y%" message displays correctly
- [ ] Different variants with different Shopify prices calculate correctly

### Subscription & Purchase Options
- [ ] Subscription toggle switches correctly
- [ ] Subscription discount fetched from Seal Subscriptions
- [ ] Green border appears on "Subscribe & Save" when selected
- [ ] Border is thicker (4px) than default (2px)
- [ ] Subscription discount applies when selected
- [ ] Add to cart button enables when minimum items selected
- [ ] Add to cart button disabled when no items selected
- [ ] Items successfully add to cart
- [ ] Cart drawer/notification opens after add
- [ ] Cart displays correct quantities and prices

### Subscription Testing
- [ ] Subscription discount percentage fetched from Seal
- [ ] "SAVE X%" badge updates with correct percentage
- [ ] Subscription selected items include selling plan ID
- [ ] Subscription items appear correctly in cart

### Responsive Design
- [ ] 2-column grid displays on mobile
- [ ] 2-column grid displays on tablet
- [ ] 2-column grid displays on desktop
- [ ] All elements scale appropriately
- [ ] Touch targets adequate on mobile
- [ ] Text remains readable at all sizes

### Multilingual
- [ ] English translations display correctly
- [ ] Finnish translations display correctly
- [ ] Translation keys work in all locations

### Browser Compatibility
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Troubleshooting

### Flavors Not Showing
- Verify 'power-cookie' collection exists
- Check that products in collection have variants
- The snippet displays ALL variants from ALL products in the collection
- If you have one product with 10 variants, you'll see 10 flavor cards
- If you have 10 products with 1 variant each, you'll see 10 flavor cards
- Ensure products/variants have images (variant images preferred, product images as fallback)

### Prices Incorrect
- Check variant prices in Shopify admin
- Verify tiered pricing configuration
- Check currency formatting

### Subscription Not Working
- Verify Seal Subscriptions app is installed
- Check that subscription widget is on page
- Ensure selling plans are configured

### Cart Not Updating
- Check browser console for errors
- Verify cart drawer element exists
- Test with different cart apps (UpCart vs default)

### Styling Issues
- Clear browser cache
- Check for CSS conflicts
- Verify custom-bundle-builder.css is loading

## Future Enhancements

### Potential Improvements
1. **Bundler.app Deep Integration**: Use Bundler API directly for bundle-specific features
2. **Saved Bundles**: Allow customers to save favorite combinations
3. **Quantity Presets**: Quick-select buttons for common quantities (5, 10, 20)
4. **Flavor Recommendations**: "Customers also added..." suggestions
5. **Bundle Naming**: Let customers name their custom bundle
6. **Delivery Frequency Selector**: In-line subscription frequency options
7. **Progress Indicator**: Visual representation of tier progress
8. **Animation Enhancements**: More engaging quantity change animations
9. **Variant Images**: Support different images per flavor variant
10. **Bundle Sharing**: Share bundle configuration via URL

## Maintenance

### Regular Updates Needed
- Update translation strings when adding new languages
- Adjust tiered pricing when prices change
- Test after Seal Subscriptions app updates
- Review after Shopify theme updates

### Files to Monitor
- `snippets/custom-bundle-builder.liquid` - Main template
- `assets/custom-bundle-builder.js` - Functionality
- `assets/custom-bundle-builder.css` - Styling
- `templates/product.power-cookie-custom-box.json` - Product template

## Support
For questions or issues, reference this document and check:
1. Browser console for JavaScript errors
2. Network tab for failed API calls
3. Shopify admin for product/collection configuration
4. Theme customizer for block visibility

---

**Implementation Date**: January 2025
**Theme**: Dawn (customized)
**Shopify Apps**: Bundler.app, Seal Subscriptions

