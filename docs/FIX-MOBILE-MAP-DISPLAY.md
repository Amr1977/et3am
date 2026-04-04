# Mobile Map Display Issue - Diagnosis & Fix

## 🔴 THE PROBLEM

The map in the hero section is not showing on mobile devices.

### Symptoms
- Desktop: Map displays correctly in hero section ✓
- Mobile (< 768px): Map does not appear ❌

### Root Causes Identified

#### Issue 1: Map height is 280px, but no fixed width constraint
```css
/* Line 3713-3715 */
@media (max-width: 768px) {
  .hero-map {
    height: 280px;
    max-width: 100%;
  }
}
```

**Problem**: The `.hero-map` has `aspect-ratio: 1` set on desktop (line 1393), but on mobile the aspect-ratio is reset to `auto` at the tablet breakpoint (line 1409):

```css
@media (max-width: 768px) {
  .hero-map {
    aspect-ratio: auto;    /* ← aspect ratio removed! */
    height: 300px;
    width: 100%;
  }
}
```

Then in the mobile breakpoint (max-width: 768px again), it only sets `height: 280px` with no explicit `width`.

#### Issue 2: Container might not have proper width
The `.hero-visual` container might not be properly constraining the width:

```css
/* Line 3708-3711 */
.hero-visual {
  display: block;
  width: 100%;
}
```

#### Issue 3: Leaflet container might not have height
Leaflet maps require explicit height to display. The leaflet-container might not be getting the proper height:

```css
/* Line 1401-1405 */
.hero-map .leaflet-container {
  border-radius: var(--radius-xl);
  height: 100% !important;
  width: 100% !important;
}
```

If the parent `.hero-map` doesn't have a height, the child won't either.

#### Issue 4: MapContainer inline styles might conflict
In Home.tsx, the MapContainer has inline styles:
```tsx
style={{ height: '100%', width: '100%', minHeight: '300px' }}
```

This expects the parent to have `height` defined.

---

## ✅ THE FIX

### Fix Applied to: `frontend/src/index.css`

**Step 1**: Find and update the tablet breakpoint (max-width: 768px, line 1407)

**Current (WRONG)**:
```css
@media (max-width: 768px) {
  .hero-map {
    aspect-ratio: auto;
    height: 300px;
    width: 100%;
  }
}
```

**Fix (CORRECT)**:
```css
@media (max-width: 768px) {
  .hero-map {
    height: 300px;
    width: 100%;
  }
}
```

Remove the `aspect-ratio: auto` line so the height remains the only constraint (simpler).

**Step 2**: Ensure mobile breakpoint (max-width: 768px, line 3713) has explicit width

**Current (COULD BE BETTER)**:
```css
.hero-map {
  height: 280px;
  max-width: 100%;
}
```

**Fix (MORE EXPLICIT)**:
```css
.hero-map {
  width: 100%;
  height: 280px;
  max-width: 100%;
  box-sizing: border-box;
}
```

**Step 3**: Ensure hero-visual properly displays the map

**Current (MIGHT BE ISSUE)**:
```css
.hero-visual {
  display: block;
  width: 100%;
}
```

**Fix (MORE EXPLICIT)**:
```css
.hero-visual {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}
```

This ensures the map container is centered and properly sized.

---

## 📋 SUMMARY OF CHANGES

| Line | Section | Issue | Fix |
|------|---------|-------|-----|
| 1407-1413 | Tablet breakpoint (≤768px) | `aspect-ratio: auto` confuses sizing | Remove `aspect-ratio: auto` |
| 3708-3716 | Mobile breakpoint (≤768px) | No explicit width on hero-visual | Add explicit width and centering |
| 3708-3716 | Mobile breakpoint (≤768px) | Generic `display: block` | Change to `display: flex` for centering |

---

## 🧪 HOW TO TEST

### Desktop (>1024px)
- Map should display in 2-column grid layout ✓
- Aspect ratio 1:1 (square) ✓

### Tablet (768px-1024px)
- Map should stack below text ✓
- Height: 350px ✓
- Width: 100% ✓

### Mobile (<768px)
- Map should display below text ✓
- Height: 280px ✓
- Width: 100% with proper padding ✓
- Map should be visible and interactive ✓

### Testing Steps:
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test breakpoints:
   - iPhone 12 (390px)
   - iPad (768px)
   - Desktop (1920px)
4. Map should show at all breakpoints

---

## 🔍 WHY THIS HAPPENED

1. **Multiple breakpoints with same width (768px)**: CSS has both line 1407 and 3578 at 768px, causing conflicts
2. **Aspect ratio reset**: Using `aspect-ratio: auto` removes the dimension, making the element collapse
3. **Missing width specification**: Height without width can cause the element to be invisible
4. **Leaflet complexity**: Leaflet maps need both parent and child to have explicit height

---

## 📝 CODE CHANGES NEEDED

### File: `frontend/src/index.css`

**Change 1** (Around line 1407):
```css
@media (max-width: 768px) {
  .hero-map {
-   aspect-ratio: auto;
    height: 300px;
    width: 100%;
  }
}
```

**Change 2** (Around line 3708-3716):
```css
.hero-visual {
- display: block;
+ display: flex;
+ justify-content: center;
+ align-items: center;
  width: 100%;
}

.hero-map {
+ width: 100%;
  height: 280px;
  max-width: 100%;
}
```

---

## 🚀 DEPLOYMENT

1. Apply the CSS fixes above
2. Rebuild frontend: `npm run build`
3. Deploy to production
4. Test on mobile devices (real devices or DevTools)
5. Verify map displays at all breakpoints

---

## ✅ VERIFICATION CHECKLIST

- [ ] Map shows on desktop
- [ ] Map shows on tablet (768-1024px)
- [ ] Map shows on mobile (<768px)
- [ ] Map is interactive (can zoom, pan, click markers)
- [ ] No console errors
- [ ] No CSS warnings
- [ ] Map Badge ("🗺️ X donations") is visible
- [ ] Markers and clustering work

---

## 🛡️ ADDITIONAL IMPROVEMENTS (Optional)

### Add Tablet-specific styling
```css
@media (max-width: 1024px) {
  .hero-map {
    height: 300px;
  }
}
```

### Add explicit Leaflet container sizing
```css
.hero-map .leaflet-container {
  border-radius: var(--radius-xl);
  height: 100% !important;
  width: 100% !important;
  display: block !important;
}
```

### Add loading state (optional)
```css
.hero-map.loading {
  background: linear-gradient(90deg, var(--border-light), var(--border));
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```
