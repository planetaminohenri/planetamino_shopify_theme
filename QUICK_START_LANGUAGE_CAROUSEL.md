# Language Carousel - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Create Metafields (One-time setup)
```
Shopify Admin → Settings → Custom Data → Products → Add definition

For each language, create:
- Namespace: carousel
- Key: images_[language_code]
- Type: List of files
- Example: carousel.images_en, carousel.images_fi
```

### Step 2: Upload Images
```
Settings → Files → Upload

Name images like:
power-cookie_en_01.jpg
power-cookie_fi_01.jpg
```

### Step 3: Add to Product
```
Products → [Select Product] → Metafields section

- Find "Carousel Images (English)"
- Click "Add images"
- Select your uploaded files
- Drag to reorder (first = first shown)
- Save
```

### Step 4: Test
```
1. View product page in English → See English images ✓
2. Switch to Finnish → See Finnish images ✓
3. Navigate carousel (arrows, thumbnails) ✓
```

---

## 🎯 Supported Languages

Create these metafield keys:

| Language | Metafield Key | Example |
|----------|---------------|---------|
| English | `carousel.images_en` | Power Cookie nutrition facts |
| Finnish | `carousel.images_fi` | Voimakeksi ravintoarvot |
| German | `carousel.images_de` | Power Cookie Nährwerte |
| Spanish | `carousel.images_es` | Galleta Power datos nutricionales |
| French | `carousel.images_fr` | Power Cookie valeurs nutritionnelles |
| Italian | `carousel.images_it` | Power Cookie valori nutrizionali |
| Dutch | `carousel.images_nl` | Power Cookie voedingswaarden |
| Swedish | `carousel.images_sv` | Power Cookie näringsvärden |

---

## 📋 What Happens Automatically

✅ **User views product in Finnish** → Shows `carousel.images_fi`  
✅ **No Finnish images exist** → Falls back to `carousel.images_en`  
✅ **No language images at all** → Shows default product gallery  
✅ **User switches language** → Page reloads with correct images  
✅ **Debug mode in Theme Editor** → Shows what's being displayed

---

## 🔧 Common Tasks

### Add images to a new product:
1. Upload files to Settings → Files
2. Go to product → Metafields
3. Add to `carousel.images_en` and `carousel.images_fi`
4. Save

### Reuse an image across products:
1. Upload image once to Files
2. Add same file to multiple products' metafields
3. Update file once = updates everywhere!

### Update existing images:
1. Upload new version with same filename (auto-replaces)
   OR
2. Go to product → Remove old → Add new → Save

### Fix wrong order:
1. Go to product → Metafields
2. Drag images to reorder
3. Save

---

## 🚨 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Images not showing | Check metafield created at Settings → Custom Data |
| Wrong language showing | Verify metafield key matches language code (e.g., `images_fi`) |
| Can't find metafields on product | Check they're created under namespace `carousel` |
| Images in wrong order | Drag to reorder in product metafields section |
| Carousel not working | Clear cache, check browser console for errors |

---

## 📸 Image Specs

| Property | Recommendation |
|----------|----------------|
| **Format** | JPG or PNG (WebP if supported) |
| **Size** | 2000px × 2000px |
| **Max File Size** | 500KB (compress!) |
| **Aspect Ratio** | Square (1:1) or 4:3 |
| **Alt Text** | Always add in correct language |

---

## 🎨 Best Practices

### Image Order (Keep consistent across languages):
1. Main product shot
2. Nutritional information
3. Benefits/features
4. Usage instructions
5. Additional details

### Naming Convention:
```
[product-handle]_[lang]_[description].[ext]

✅ power-cookie_en_nutrition.jpg
✅ protein-powder_fi_benefits.jpg
❌ IMG_12345.jpg
```

### File Organization:
- Upload all language versions of the same content together
- Use descriptive names
- Add alt text immediately after upload

---

## ✅ Launch Checklist

Before going live:

- [ ] Metafields created for all languages
- [ ] Test product has images for EN and FI
- [ ] Tested English → sees English images
- [ ] Tested Finnish → sees Finnish images  
- [ ] Tested product without language images → sees default gallery
- [ ] Mobile tested
- [ ] Carousel navigation works
- [ ] Alt text added
- [ ] Content team trained

---

## 📞 Need Help?

1. **Check debug info:** View product in Theme Editor
2. **Verify setup:** Settings → Custom Data → Products
3. **Check uploads:** Settings → Files
4. **Read full guide:** See `LANGUAGE_CAROUSEL_SETUP.md`

---

**That's it! You're ready to go.** 🚀

Start with one product, test thoroughly, then expand to others.

