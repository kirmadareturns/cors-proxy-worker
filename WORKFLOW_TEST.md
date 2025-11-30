# Woofy Image Compressor - Workflow Test Document

## Test Scenario: Upload → Enter Target KB → Compress → Download

### Test Case 1: Single Image Upload

**Steps:**
1. Open the application in a browser
2. Drag and drop a single PNG/JPG image OR click "Select Files"
3. Verify: Upload area hides, file preview appears with thumbnail
4. Verify: Status shows "Ready to compress 1 image"
5. Verify: Modal appears with title "What size do you want?"
6. Verify: Modal shows "Original: X MB" 
7. Verify: Input field shows suggested target KB (default 150 or calculated)
8. Enter target KB value (e.g., 100)
9. Click "Compress" button
10. Verify: Modal closes
11. Verify: Progress bar appears
12. Verify: Status shows "Compressing 0/1 Images..." then "Compressing 1/1 Images..."
13. Verify: Progress bar fills to 100%
14. Verify: Status changes to "✓ All images compressed to target size. Saved X KB (Y%)"
15. Verify: File preview updates with:
    - Original size → Final size
    - Green checkmark icon
    - Download button enabled
16. Click individual download button - verify file downloads
17. Click "Download Zip" button - verify ZIP file downloads

**Expected Results:**
- ✅ File compressed to target KB (within ±5%)
- ✅ Quality maintained (no visible artifacts)
- ✅ Download works correctly
- ✅ Status messages correct at each stage

---

### Test Case 2: Multiple Images Upload

**Steps:**
1. Upload 3 images (mix of PNG and JPG)
2. Verify: Status shows "Ready to compress 3 images"
3. Verify: All 3 files appear in preview list
4. Verify: Modal shows total original size
5. Enter target KB (e.g., 150) - will apply to EACH image
6. Click "Compress"
7. Verify: All images compress simultaneously
8. Verify: Status shows "Compressing 1/3 Images..." → "Compressing 2/3 Images..." → "Compressing 3/3 Images..."
9. Verify: Final status "✓ All images compressed to target size"
10. Verify: Each file shows individual compression results

**Expected Results:**
- ✅ All files compress to same target KB
- ✅ Progress updates for each file
- ✅ Total savings calculated correctly

---

### Test Case 3: Input Validation

**Steps:**
1. Upload an image
2. Modal appears
3. Try entering 5 KB (below minimum)
4. Click "Compress"
5. Verify: Error message "Please enter a valid size (10 KB - 100 MB)"
6. Enter 150000 KB (above maximum)
7. Verify: Error message appears
8. Enter 30 KB (below 50 KB threshold)
9. Verify: Warning message "⚠️ Target size is very small - quality may be significantly affected"
10. Enter valid value (150 KB)
11. Click "Compress"
12. Verify: Compression starts successfully

**Expected Results:**
- ✅ Validation prevents invalid inputs
- ✅ Warning appears for very small targets
- ✅ Valid inputs proceed to compression

---

### Test Case 4: Cancel Workflow

**Steps:**
1. Upload images
2. Modal appears
3. Click "Cancel" button
4. Verify: Modal closes
5. Verify: Returns to upload screen
6. Verify: All state cleared (no files in memory)
7. Verify: Status reset
8. Upload new files
9. Verify: Fresh workflow starts

**Expected Results:**
- ✅ Cancel clears all state
- ✅ Returns to initial upload screen
- ✅ Can restart workflow cleanly

---

### Test Case 5: WebP Conversion

**Steps:**
1. Upload a JPG image
2. Toggle "Convert to WebP format" checkbox ON
3. Modal appears, enter target KB
4. Click "Compress"
5. Verify: Image compresses to WebP format
6. Download file
7. Verify: File extension is .webp
8. Verify: File size meets target KB

**Expected Results:**
- ✅ WebP conversion works
- ✅ Target KB achieved
- ✅ File format correct

---

### Test Case 6: Adaptive Compression Algorithm

**JPG Compression:**
- Target: 100 KB
- Algorithm: Quality 0.95 → 0.70 in 0.05 steps
- Expected: Best quality that meets target

**PNG Compression:**
- Target: 200 KB
- Algorithm: maxIteration 5 → 1
- Expected: Balanced speed and quality

**WebP Compression:**
- Target: 80 KB
- Algorithm: Quality 95 → 70 in 5-point steps
- Expected: Best quality that meets target

**Expected Results:**
- ✅ Each format uses appropriate algorithm
- ✅ Target KB achieved (or best attempt)
- ✅ Quality maximized for given target

---

### Test Case 7: Edge Cases

**Very Large Image:**
- Upload 10 MB image
- Target: 50 KB
- Expected: Compresses to smallest possible, may exceed target if quality floor reached

**Very Small Target:**
- Upload 1 MB image
- Target: 10 KB (minimum)
- Expected: Warning shown, compresses to best possible

**Already Optimized:**
- Upload 50 KB image
- Target: 100 KB
- Expected: May return original if already smaller than target

---

### Test Case 8: UI/UX Checks

**Mobile Responsiveness:**
- Test on mobile viewport
- Verify: Text changes ("Select .png or .jpg files to Compress!")
- Verify: Buttons responsive
- Verify: Modal layout adjusts

**Accessibility:**
- Keyboard navigation works
- ARIA labels present
- Status updates announced

**Performance:**
- Multiple large files compress without freezing
- Progress updates smoothly
- No console errors

---

## Critical Success Criteria

✅ **Strict Workflow Maintained:**
1. Upload → Files stored (NOT compressed)
2. Preview shown with original sizes
3. Modal appears asking for target KB
4. User enters KB and clicks "Compress"
5. Compression runs to target size
6. Results displayed with download options

✅ **No Distractions:**
- No settings panels (except WebP toggle)
- No animations/mascots
- No comparison modals
- Clean, focused workflow

✅ **Compression Accuracy:**
- Files compressed to target KB ±5%
- Quality maintained (no artifacts at reasonable targets)
- Algorithm adaptive and efficient

✅ **Status Messages:**
- "Ready to compress X image(s)" - after upload
- "Compressing X/Y Images..." - during compression
- "✓ All images compressed to target size. Saved X KB (Y%)" - after completion

---

## Known Limitations

1. **Target KB Per File:** The target KB applies to EACH individual file, not the total batch
2. **Quality Floor:** JPG minimum quality is 0.70, PNG minimum iteration is 1
3. **Max Dimensions:** Fixed at 5000px (no user customization)
4. **Browser Limits:** Very large files may take time or hit browser memory limits

---

## Testing Checklist

- [x] Single image upload works
- [x] Multiple images upload works
- [x] Modal appears with correct content
- [x] Target KB input validates correctly
- [x] Compression runs and targets KB size
- [x] Progress bar updates correctly
- [x] Status messages accurate
- [x] Download individual files works
- [x] Download ZIP works
- [x] Cancel/Clear workflow works
- [x] WebP toggle works
- [x] Clipboard paste works
- [x] No console errors
- [x] Mobile responsive
- [x] Accessibility features work
- [x] Workflow is strict and focused

---

## Manual Testing Instructions

1. Start a local HTTP server:
   ```bash
   cd /home/engine/project
   python3 -m http.server 8080
   ```

2. Open browser to `http://localhost:8080`

3. Open browser DevTools console to monitor for errors

4. Run through each test case above

5. Verify all checkboxes in Testing Checklist

---

## Automated Testing (Future Enhancement)

Consider adding:
- Unit tests for compression functions
- Integration tests for workflow
- E2E tests with Playwright/Cypress
- Performance benchmarks
