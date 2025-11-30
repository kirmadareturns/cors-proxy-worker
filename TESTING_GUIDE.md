# Woofy Image Compressor - Testing Guide

## Quick Start

### 1. Start Local Server
```bash
cd /home/engine/project
python3 -m http.server 8000
```

### 2. Open in Browser
Navigate to: `http://localhost:8000/`

### 3. Open Developer Console
Press `F12` to open browser developer tools and check the Console tab

## Expected Behavior

### Page Load
- ✅ No JavaScript errors in console
- ✅ Page displays with header "🐕 Woofy Image Compressor"
- ✅ Upload drop area visible with text "📁 Drag & Drop .png or .jpg files here!"
- ✅ Upload button visible: "📤 or Click to Select Files"
- ✅ Woofy mascot visible in bottom-left corner
- ✅ Speech bubble appears after ~400ms: "Hi there! 👋"

### Test 1: Drag and Drop Upload
1. Find a PNG or JPG image on your computer
2. Drag it over the upload area
3. Expected: Upload area should highlight (green border, light background)
4. Drop the file
5. Expected:
   - Upload area disappears
   - File management section appears
   - Rocket animation 🚀 flies up
   - Woofy puts on astronaut suit 🧑‍🚀
   - Speech bubble says "WEEEEEEEE!!!!!"
   - File appears in list with thumbnail
   - Progress bar shows compression progress
   - File size shows: "before → after"
   - Percentage reduction displayed

### Test 2: Click Upload Button
1. Click the "📤 or Click to Select Files" button
2. Expected: File picker dialog opens
3. Select one or more PNG/JPG files
4. Expected: Same behavior as drag-and-drop test

### Test 3: Clipboard Paste
1. Copy an image to clipboard (from screenshot tool, image editor, etc.)
2. Focus the browser window
3. Press Ctrl+V (Windows/Linux) or Cmd+V (Mac)
4. Expected: Same behavior as drag-and-drop test

### Test 4: Settings Adjustment
1. Upload at least one image (using any method)
2. Click "⚙️ Settings" button
3. Expected: Settings panel expands
4. Adjust quality slider
   - Expected: Value updates (e.g., "70%")
5. Enter max width/height (e.g., 1920)
6. Check "Convert to WebP format"
7. Enter filename prefix (e.g., "-min")
8. Click "🔄 Recompress" button
9. Expected:
   - All images reprocess with new settings
   - Progress bar animates again
   - File sizes update
   - If WebP enabled, file extensions change to .webp

### Test 5: Download Individual File
1. After compression completes
2. Click the download icon (⬇️) next to any file
3. Expected: File downloads with proper name and compression applied

### Test 6: Download All as ZIP
1. After multiple files are compressed
2. Click "Download Zip" button at bottom
3. Expected:
   - ZIP file downloads
   - Contains all compressed images
   - Filenames include prefix if set

### Test 7: Before/After Comparison
1. After compression completes
2. Click on any file thumbnail (or zoom icon if visible)
3. Expected:
   - Comparison modal opens
   - Shows before/after images
   - Slider in middle allows dragging to compare
   - Close button (✕) visible
4. Drag slider left/right
5. Expected: Reveals original vs. compressed image
6. Press ESC or click close button
7. Expected: Modal closes

### Test 8: Add More Files
1. After uploading and compressing files
2. Scroll down
3. Click "Add More Files" button
4. Expected: File picker opens
5. Select more images
6. Expected: New files added to existing list

### Test 9: Clear All Files
1. After files are uploaded
2. Click "Clear Files" button
3. Expected:
   - All files removed from list
   - Upload area reappears
   - Can start fresh upload

## Error Testing

### Test: Invalid File Type
1. Try to upload a non-image file (e.g., .txt, .pdf)
2. Expected:
   - Woofy speech bubble turns red
   - Shows error message: "Only JPG & PNG Files Please!"

### Test: Browser Compatibility
Test in multiple browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Expected: All features work in modern browsers

## Console Checks

### Expected Console Output
```
[No errors should appear]
```

### Possible Warnings (Harmless)
- CDN library version messages
- CORS warnings (if testing locally)
- WebAssembly loading messages

### Red Flags (Should NOT See)
- ❌ "webp_enc is not defined"
- ❌ "Cannot read property of undefined"
- ❌ "Failed to fetch"
- ❌ "Uncaught TypeError"
- ❌ "Uncaught ReferenceError"

## Mobile Testing

### On Mobile Devices or Responsive Mode
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select mobile device or resize to < 768px
4. Expected:
   - Layout adapts to mobile
   - Upload text changes to "Select .png or .jpg files to Compress!"
   - Buttons show shorter text ("Add" instead of "Add More Files")
   - Woofy speech bubble shows "Select Images to Get Started!"
   - Touch interactions work smoothly

## Performance Checks

### Small Files (< 1MB)
- Compression should complete in < 2 seconds per file

### Medium Files (1-5MB)
- Compression should complete in 2-5 seconds per file

### Large Files (5-10MB)
- Compression may take 5-10 seconds per file

### Batch Processing
- Multiple files process in parallel
- Progress bar updates smoothly
- No browser freezing or UI lag

## Troubleshooting

### Issue: Page loads but nothing happens when uploading
**Check:**
1. Open Console (F12) - look for errors
2. Verify all CDN scripts loaded (Network tab)
3. Check if `webp_enc` is defined: Type `window.webp_enc` in console
4. Should return a function, not `undefined`

### Issue: WebP conversion not working
**Check:**
1. Browser supports WebAssembly (Chrome, Firefox, Edge, Safari 14+)
2. CDN connection working (check Network tab)
3. `window.webp_enc` exists in console

### Issue: Download not working
**Check:**
1. Browser allows downloads
2. FileSaver.js loaded (check Network tab)
3. Popup blocker not interfering

### Issue: Drag-and-drop not working
**Check:**
1. Testing in actual browser (not file:// protocol)
2. Drag valid image files (PNG/JPG only)
3. Upload area element exists (inspect with DevTools)

## Success Criteria

✅ All upload methods work (drag-drop, click, paste)  
✅ Compression works for PNG files  
✅ Compression works for JPG files  
✅ WebP conversion works when enabled  
✅ Settings can be adjusted  
✅ Recompression works  
✅ Individual downloads work  
✅ Batch ZIP download works  
✅ Before/after comparison works  
✅ Mobile responsive design works  
✅ No console errors  
✅ Smooth performance  

## Automated Testing

Run the included test script:
```bash
# Start server first
python3 -m http.server 8000 &

# In another terminal
node test-page.js
```

Expected output: All tests should pass (21/21)

---

**If all tests pass:** ✅ The HTML-JS linking is working correctly!

**If any tests fail:** See FIX_SUMMARY.md and TEST_RESULTS.md for troubleshooting.
