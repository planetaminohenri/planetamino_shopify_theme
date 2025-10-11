# Custom Bundle Builder - Quick Start Guide

## What You Need to Know

### The Problem We Solved
The old bundler shortcode displayed an ugly list of selected products. The new custom bundle builder provides a clean 2-column grid where users can easily select flavors and quantities.

### The Solution
- **Clean UI**: Two-column grid with product images and prices
- **Simple Interaction**: Click "Add" to show quantity selector
- **Dynamic Pricing**: Real-time price updates with tiered pricing
- **Subscription Support**: Integrates with Seal Subscriptions

## How It Works

### For Customers
1. Visit `/products/power-cookie`
2. See all Power Cookie flavors in a 2-column grid
3. Click "Add" on any flavor to select it
4. Use +/- buttons to adjust quantity
5. See total price update in real-time
6. Choose one-time purchase or subscription
7. Click "Add to cart"

### For You (Store Owner)
The bundle builder automatically:
- Fetches products from 'power-cookie' collection
- Displays current prices from Shopify
- Calculates tiered pricing (5+ = €2.79, 20+ = €2.49, 40+ = €2.29)
- Fetches subscription discount from Seal Subscriptions
- Adds all items to cart with proper properties

## Quick Configuration

### Change Pricing Tiers
Edit `assets/custom-bundle-builder.js`, line 10-15:
```javascript
priceTiers: [
  { min: 40, price: 2.29 },  // 40+ cookies
  { min: 20, price: 2.49 },  // 20-39 cookies
  { min: 5, price: 2.79 },   // 5-19 cookies
  { min: 0, price: 2.79 }    // 1-4 cookies
]
```

### Change Minimum Required Items
Edit `assets/custom-bundle-builder.js`, line 19:
```javascript
minItems: 1  // Change to any number
```

### Change Which Products Show
Edit `snippets/custom-bundle-builder.liquid`, line 20:
```liquid
assign cookie_collection = collections['power-cookie']
```

### Customize Colors
Edit `assets/custom-bundle-builder.css` to change:
- `--color-primary`: Main brand color (#330073)
- `--color-primary-dark`: Darker shade (#28005A)
- `--color-primary-light`: Lighter shade (#E6E2FD)

## Testing Instructions

### Basic Test
1. Open `/products/power-cookie` in your browser
2. You should see a 2-column grid of cookies
3. Click "Add" on any cookie
4. Quantity selector should appear with "1"
5. Total price should update at the bottom
6. Click "Add to cart"
7. Cart should open with your items

### Subscription Test
1. Follow basic test steps 1-5
2. Click "Subscribe & save" radio button
3. Price should update with discount
4. Click "Add to cart"
5. Cart should show subscription items

### Mobile Test
1. Open on mobile device
2. Grid should still show 2 columns
3. All buttons should be easy to tap
4. Pricing should be readable

## Common Issues & Fixes

### ❌ No Products Showing
**Problem**: Collection might be empty or wrong name
**Fix**: 
1. Go to Shopify Admin → Products → Collections
2. Find 'power-cookie' collection
3. Ensure it has products with variants
4. The builder displays ALL variants from ALL products in the collection
5. Check that variants have images (variant images preferred)
6. Or change collection name in `snippets/custom-bundle-builder.liquid`

### ❌ Prices Look Wrong
**Problem**: Prices might not be formatted correctly
**Fix**: Check that prices in Shopify are in EUR and formatted properly

### ❌ Subscription Discount Not Showing
**Problem**: Seal Subscriptions might not be configured
**Fix**: 
1. Check Seal Subscriptions app is installed
2. Verify selling plans are configured for Power Cookie products
3. Default 10% will be used if Seal discount can't be fetched

### ❌ Add to Cart Doesn't Work
**Problem**: JavaScript error or cart incompatibility
**Fix**:
1. Open browser console (F12)
2. Look for red error messages
3. Check that cart drawer exists on page
4. Try refreshing the page

### ❌ Styling Looks Off
**Problem**: CSS might not be loading or conflicts exist
**Fix**:
1. Hard refresh browser (Ctrl+Shift+R)
2. Check `custom-bundle-builder.css` is loading in Network tab
3. Look for CSS conflicts with other styles

## File Locations

### Main Files
- `snippets/custom-bundle-builder.liquid` - Template/HTML
- `assets/custom-bundle-builder.js` - Functionality
- `assets/custom-bundle-builder.css` - Styling
- `templates/product.power-cookie-custom-box.json` - Product page config

### Translation Files
- `locales/en.default.json` - English translations
- `locales/fi.json` - Finnish translations

### Documentation
- `CUSTOM_BUNDLE_IMPLEMENTATION.md` - Full technical documentation
- `BUNDLE_BUILDER_QUICK_START.md` - This file

## Making Changes

### To Change Text/Labels
1. Edit translation files in `locales/` folder
2. Find key like `bundles.add_button`
3. Change value, save
4. Refresh browser to see changes

### To Change Styling
1. Edit `assets/custom-bundle-builder.css`
2. Find the CSS class you want to change
3. Modify properties
4. Save and hard refresh browser

### To Change Behavior
1. Edit `assets/custom-bundle-builder.js`
2. Find the function you need to modify
3. Make changes carefully
4. Test thoroughly after changes

## Support Checklist

Before asking for help:
- [ ] I cleared my browser cache
- [ ] I checked browser console for errors
- [ ] I verified the collection exists and has products
- [ ] I tested on a different browser
- [ ] I checked that products have prices
- [ ] I reviewed the error messages

## Need More Help?

1. Check `CUSTOM_BUNDLE_IMPLEMENTATION.md` for detailed technical info
2. Review browser console for specific error messages
3. Test in incognito mode to rule out caching issues
4. Check Shopify admin for product/collection configuration

---

**Last Updated**: January 2025

