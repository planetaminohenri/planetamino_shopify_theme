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

### Dynamic Pricing
- Fetches actual prices from product variants (not hardcoded)
- Calculates tiered pricing based on total quantity
- Applies subscription discount when selected
- Shows both original and discounted price

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

### Tiered Pricing
Edit `CONFIG.priceTiers` in `assets/custom-bundle-builder.js`:
```javascript
priceTiers: [
  { min: 40, price: 2.29 },
  { min: 20, price: 2.49 },
  { min: 5, price: 2.79 },
  { min: 0, price: 2.79 }
]
```

### Minimum Items
Edit `CONFIG.minItems` in `assets/custom-bundle-builder.js`:
```javascript
minItems: 1  // Change to require minimum items
```

### Collection Source
Edit the collection in `snippets/custom-bundle-builder.liquid`:
```liquid
assign cookie_collection = collections['power-cookie']
```

## Testing Checklist

### Functionality
- [ ] Flavor cards load correctly from 'power-cookie' collection
- [ ] Prices display correctly for each flavor
- [ ] "Add" button appears initially
- [ ] Clicking "Add" shows quantity selector with quantity 1
- [ ] Quantity +/- buttons work correctly
- [ ] Quantity returns to "Add" button when set to 0
- [ ] Total quantity updates in real-time
- [ ] Total price calculates correctly
- [ ] Tiered pricing applies at correct thresholds (5, 20, 40)
- [ ] "Add X more to save" message displays correctly
- [ ] Subscription toggle switches correctly
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

