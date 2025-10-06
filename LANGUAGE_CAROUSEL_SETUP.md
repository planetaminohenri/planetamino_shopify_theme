# Language-Specific Product Carousel Setup Guide

## 📋 Overview

This feature allows you to display different product images based on the customer's selected language. Perfect for showing localized nutritional information, marketing materials, and product descriptions in the customer's preferred language.

---

## 🎯 Quick Start

### Step 1: Create Product Metafield Definitions

1. Go to **Shopify Admin** → **Settings** → **Custom Data** → **Products**
2. Click **"Add definition"**
3. Create the following metafield definitions:

#### Metafield Configuration

| Setting | Value |
|---------|-------|
| **Namespace and key** | `carousel.images_en` |
| **Name** | Carousel Images (English) |
| **Description** | Language-specific product images for English |
| **Type** | List of files |
| **Validation** | Files must be images |

Repeat this process for **each language** your store supports:

- `carousel.images_en` - English
- `carousel.images_fi` - Finnish
- `carousel.images_de` - German
- `carousel.images_es` - Spanish
- `carousel.images_fr` - French
- `carousel.images_it` - Italian
- `carousel.images_nl` - Dutch
- `carousel.images_sv` - Swedish
- `carousel.images_da` - Danish
- `carousel.images_nb` - Norwegian
- `carousel.images_pl` - Polish
- `carousel.images_pt_BR` - Portuguese (Brazil)
- `carousel.images_pt_PT` - Portuguese (Portugal)

**Important:** The language code must match Shopify's ISO codes (e.g., `fi`, `en`, `de`).

---

## 📁 Step 2: Upload Images to Shopify Files

### Best Practices for Image Organization

1. **Naming Convention:**
   ```
   product-handle_language_description.jpg
   
   Examples:
   - power-cookie_en_nutrition-facts.jpg
   - power-cookie_fi_ravintoarvot.jpg
   - protein-powder_en_benefits-01.jpg
   - protein-powder_fi_hyödyt-01.jpg
   ```

2. **Image Specifications:**
   - **Format:** JPG, PNG, or WebP
   - **Minimum Width:** 1500px (for high-DPI displays)
   - **Recommended:** 2000px × 2000px
   - **Aspect Ratio:** Keep consistent (square or 4:3 recommended)
   - **File Size:** Optimize to under 500KB per image

3. **Upload Process:**
   - Go to **Settings** → **Files**
   - Click **"Upload files"**
   - Select all images for a language
   - Wait for upload completion

**Pro Tip:** Upload all versions of the same image together (all languages) so they're easy to find later.

---

## 🖼️ Step 3: Assign Images to Products

### For Individual Products:

1. Go to **Products** → Select a product
2. Scroll down to **"Metafields"** section
3. Find your carousel metafields (e.g., "Carousel Images (English)")
4. Click **"Add images"**
5. Select images from your uploaded files
6. **Drag to reorder** - the order matters! First image shows first.
7. Click **"Save"**

### Image Order Best Practices:

1. **First Image:** Hero shot / Main product image
2. **Second Image:** Nutritional information / Facts
3. **Third Image:** Benefits / Features
4. **Fourth Image:** Usage instructions / Recipes
5. **Fifth+ Images:** Additional details, certifications, etc.

---

## 🔄 Step 4: Repeat for Each Language

For each language your store supports:

1. Upload language-specific images to Files
2. Add them to the appropriate metafield (`carousel.images_fi`, `carousel.images_de`, etc.)
3. Maintain the same order across languages for consistency

**Example for a Finnish product:**

| Language | Metafield | Images |
|----------|-----------|--------|
| English | `carousel.images_en` | [product-en-01.jpg, nutrition-en.jpg, benefits-en.jpg] |
| Finnish | `carousel.images_fi` | [product-fi-01.jpg, ravintoarvot-fi.jpg, hyödyt-fi.jpg] |

---

## ♻️ Reusing Images Across Products

**Good news:** You can use the same image file for multiple products!

### Example Scenario:

You have a generic "Vegan Protein" benefits image in Finnish that applies to all protein products.

**Solution:**
1. Upload `vegan-protein-benefits_fi.jpg` **once** to Files
2. Add this same file to the `carousel.images_fi` metafield of:
   - Protein Powder Vanilla product
   - Protein Powder Chocolate product
   - Protein Powder Strawberry product

**Benefits:**
- ✅ One file, multiple products
- ✅ Update once, reflects everywhere
- ✅ Better CDN caching
- ✅ Easier to manage

---

## 🎨 How It Works (Technical)

### Fallback Logic:

The system uses a smart fallback system:

```
1. Try current language (e.g., Finnish)
   ↓ (if not found)
2. Try English (default)
   ↓ (if not found)
3. Use default product.media gallery
```

**Examples:**

| Scenario | User Language | Carousel Shows |
|----------|---------------|----------------|
| Finnish images exist | Finnish (fi) | Finnish images |
| No Finnish images | Finnish (fi) | English images (fallback) |
| No language images | Any language | Default product gallery |

### Debug Mode:

When viewing products in **Theme Editor** (Shopify Admin), you'll see a debug panel showing:
- Current language detected
- Whether language carousel is active
- Number of images found
- Fallback status

This helps you verify the setup is working correctly!

---

## 📱 Products Affected

The language carousel is enabled on these product templates:

- ✅ All Protein Cookie Flavors
- ✅ Haluan Maistaa Kaikkia (bundle)
- ✅ Power Cookie Custom Box
- ✅ Proteiinijauhe (Finnish protein powder)
- ✅ Protein Powder (English)
- ✅ Taste Them All Bundle
- ✅ Test Bundle

**Product cards** on the homepage and collection pages continue to use the default featured image.

---

## 🧪 Testing Your Setup

### Test Checklist:

1. **Upload Test Images:**
   - [ ] Upload at least 2 different images for English
   - [ ] Upload at least 2 different images for Finnish

2. **Assign to Product:**
   - [ ] Add English images to `carousel.images_en`
   - [ ] Add Finnish images to `carousel.images_fi`
   - [ ] Save the product

3. **Test on Storefront:**
   - [ ] View product page in English
   - [ ] Verify English images show
   - [ ] Switch language to Finnish (via language picker)
   - [ ] Verify Finnish images show after page reload
   - [ ] Test carousel navigation (next/prev buttons)
   - [ ] Test thumbnail clicks

4. **Test Fallback:**
   - [ ] Create a test product with only English images
   - [ ] View in Finnish - should show English images
   - [ ] Create a test product with no language images
   - [ ] View in any language - should show default gallery

---

## 🚨 Troubleshooting

### Problem: Language images not showing

**Possible causes:**

1. **Metafield not created:**
   - Go to Settings → Custom Data → Products
   - Verify metafield exists (e.g., `carousel.images_fi`)

2. **Wrong namespace/key:**
   - Namespace must be: `carousel`
   - Key must match language code: `images_fi` (not `images-fi` or `imagesFi`)

3. **Images not assigned:**
   - Go to product → Metafields
   - Verify images are added to the correct metafield

4. **Language code mismatch:**
   - Check language picker URL: `/fi/products/...`
   - Metafield key must match: `carousel.images_fi`
   - Common mistake: Using `images_fin` instead of `images_fi`

### Problem: Images show in wrong order

**Solution:**
- Go to product metafields
- Drag and drop images to reorder
- First image = first in carousel
- Save the product

### Problem: Images don't load on mobile

**Solution:**
- Verify images are under 1MB
- Check image URLs in browser dev tools
- Ensure images uploaded successfully to Shopify Files

### Problem: Zoom not working

**Solution:**
- Check that "Image Zoom" is set to "Lightbox" or "Hover" in theme settings
- Language carousel supports both zoom modes
- Try clearing browser cache

---

## 📝 Content Team Workflow

### Adding a New Product:

1. **Prepare Content:**
   - [ ] Gather product images for all languages
   - [ ] Name files with convention: `product_lang_description.jpg`
   - [ ] Optimize images (compress to under 500KB)

2. **Upload:**
   - [ ] Go to Settings → Files
   - [ ] Upload all language versions together
   - [ ] Note the file names for reference

3. **Assign:**
   - [ ] Create/edit product
   - [ ] Scroll to Metafields section
   - [ ] Add images to each language metafield
   - [ ] **Important:** Keep same order across languages
   - [ ] Save

4. **Verify:**
   - [ ] Preview product in English
   - [ ] Switch to Finnish and verify
   - [ ] Test on mobile device

### Updating Existing Product Images:

1. **Option A: Update in Place**
   - Upload new image with same filename
   - It will replace old version automatically
   - All products using that file will update

2. **Option B: Replace Metafield**
   - Go to product → Metafields
   - Remove old image from metafield
   - Add new image
   - Save

---

## 🎯 SEO Best Practices

### Image Alt Text:

When uploading images to Shopify Files, **always add alt text**:

1. In Files section, click on an image
2. Add descriptive alt text in the correct language
3. Examples:
   - English: `"Planet Amino Power Cookie nutritional information"`
   - Finnish: `"Planet Amino Voimakeksi ravintoarvotiedot"`

### Benefits:
- ✅ Better SEO (Google Images)
- ✅ Accessibility (screen readers)
- ✅ Shows if image fails to load

---

## 🔮 Advanced: Bulk Operations

### Using CSV Import:

For updating many products at once, you can use Shopify's CSV import:

1. Export products as CSV
2. Add columns:
   - `Metafield: carousel.images_en [list.file_reference]`
   - `Metafield: carousel.images_fi [list.file_reference]`
3. Add file URLs (from Shopify Files)
4. Import CSV

**Note:** This requires technical knowledge of Shopify's metafield CSV format.

---

## 📊 Quick Reference

### Metafield Namespace & Keys:

```
carousel.images_en    → English
carousel.images_fi    → Finnish
carousel.images_de    → German
carousel.images_es    → Spanish
carousel.images_fr    → French
carousel.images_it    → Italian
carousel.images_nl    → Dutch
carousel.images_sv    → Swedish
carousel.images_da    → Danish
carousel.images_nb    → Norwegian
```

### File Naming Convention:

```
[product-handle]_[lang]_[description].[ext]

Examples:
power-cookie_en_nutrition.jpg
power-cookie_fi_ravintoarvot.jpg
protein-powder_en_benefits-01.jpg
```

---

## 🆘 Getting Help

If you encounter issues:

1. **Check Debug Panel:** View product in Theme Editor to see debug info
2. **Verify Metafields:** Settings → Custom Data → Products
3. **Check Files:** Settings → Files (ensure images uploaded)
4. **Browser Console:** Open dev tools, check for JavaScript errors
5. **Language URLs:** Verify URLs match pattern: `/fi/products/...`

---

## ✅ Success Checklist

Before launching:

- [ ] All metafields created for supported languages
- [ ] Test images uploaded and assigned to at least one product
- [ ] Tested in English - carousel shows English images
- [ ] Tested in Finnish - carousel shows Finnish images
- [ ] Tested fallback - product without language images shows default gallery
- [ ] Mobile testing completed
- [ ] Carousel navigation (arrows, thumbnails) works
- [ ] Image zoom functionality working
- [ ] Alt text added to all images (SEO)
- [ ] Content team trained on workflow

---

## 🚀 Next Steps

1. **Start Small:** Test with 1-2 products first
2. **Gather Feedback:** See how users interact with localized images
3. **Expand:** Roll out to more products gradually
4. **Optimize:** Based on analytics, adjust image content
5. **Maintain:** Keep images updated as products change

---

**Need more help?** Contact your developer or refer to the Shopify Metafields documentation.

**Feature Version:** 1.0  
**Last Updated:** 2025-01-06  
**Shopify Theme:** Dawn-based Planet Amino Theme

