# 🐕 Woofy Image Compressor

A free, fast, and secure online image compression tool that runs entirely in your browser.

## ✨ Key Features

- **Target Size Compression** - Specify exact file size in KB, get optimized images
- **Smart Adaptive Algorithm** - Automatically finds best quality for your target size
- **Multiple Format Support** - JPG, PNG, and WebP conversion
- **Batch Processing** - Compress multiple images simultaneously
- **100% Client-Side** - Your images never leave your device
- **No File Size Limits** - Compress images of any size
- **Free Forever** - No accounts, no payments, no tracking

---

## 🚀 Quick Start

1. **Upload** - Drag & drop or select your PNG/JPG images
2. **Set Target** - Enter desired file size in KB (e.g., 150)
3. **Compress** - Click "Compress" and wait for magic
4. **Download** - Get your optimized images individually or as a ZIP

---

## 📋 Workflow

### Step 1: Upload Images
- Drag and drop files onto the upload area
- Or click "Select Files" to browse
- Or paste images from clipboard (Ctrl+V / Cmd+V)
- Supported formats: JPG, PNG

### Step 2: Enter Target Size
- Modal appears asking "What size do you want? (KB)"
- Shows your original file size
- Enter desired target size (10 KB - 100 MB)
- Suggested target is pre-filled (150 KB or 50% of original)

### Step 3: Compression
- Click "Compress" button
- Progress bar shows real-time status
- All images compress simultaneously
- Adaptive algorithm targets your specified KB size

### Step 4: Download
- View before/after sizes for each image
- Download individual files
- Or download all as a ZIP file

---

## 🎯 Compression Algorithm

### JPG Compression
- Quality range: 0.95 → 0.70
- Binary search approach
- Step size: 0.05
- Max dimensions: 5000px
- Returns best result within target

### PNG Compression
- Iteration-based optimization
- Levels: 5 → 1
- Uses web workers for performance
- Maintains transparency
- Max dimensions: 5000px

### WebP Compression (Optional)
- Quality range: 95 → 70
- WASM-powered encoding
- Step size: 5
- Modern format support
- Excellent compression ratios

### Target Accuracy
- Aims for ±5% of target KB
- Falls back to best achievable if target impossible
- Maintains quality floor to prevent artifacts

---

## 💡 Usage Tips

### Choosing Target Size
- **150 KB** - Good for web thumbnails
- **300 KB** - Balanced for web images
- **500 KB** - High quality for galleries
- **< 50 KB** - May show quality loss (warning shown)

### Best Practices
1. Start with suggested target size
2. Adjust based on visual quality
3. Use WebP for modern browsers (better compression)
4. Compress originals, keep backups
5. Test different targets for optimal balance

---

## 🛠️ Technical Details

### Technologies
- **Vanilla JavaScript** - No framework dependencies
- **browser-image-compression** - PNG optimization
- **Compressor.js** - JPG compression
- **@jsquash/webp** - WebP WASM encoder
- **JSZip** - ZIP file creation
- **FileSaver.js** - Download handling

### Browser Requirements
- Chrome 80+
- Firefox 75+
- Safari 14+
- Edge 80+
- Modern ES6+ support required

### Privacy & Security
- 100% client-side processing
- No server uploads
- No data collection
- No cookies or tracking
- Your images never leave your device

---

## 📱 Mobile Support

Fully responsive design optimized for:
- iOS Safari
- Android Chrome
- Touch-friendly controls
- Paste from photos app
- Save to device

---

## ♿ Accessibility

- WCAG 2.1 AA compliant
- Screen reader support
- Keyboard navigation
- ARIA labels and live regions
- High contrast support
- Reduced motion support

---

## 🔧 Local Development

### Setup
```bash
# Clone repository
git clone <repository-url>
cd project

# Start local server
python3 -m http.server 8080

# Open in browser
open http://localhost:8080
```

### File Structure
```
project/
├── index.html              # Main HTML file with inline CSS
├── my-app.js              # Application logic
├── .gitignore             # Git ignore rules
├── README.md              # This file
├── WORKFLOW_TEST.md       # Testing documentation
├── WORKFLOW_IMPLEMENTATION.md  # Technical documentation
└── CHANGES_SUMMARY.md     # Change log
```

---

## 🧪 Testing

See [WORKFLOW_TEST.md](WORKFLOW_TEST.md) for comprehensive testing guide.

### Quick Test
1. Upload test image
2. Enter target KB (e.g., 100)
3. Click "Compress"
4. Verify compressed size ≈ target KB
5. Download and check quality

### Test Checklist
- [x] Single image upload
- [x] Multiple image batch
- [x] Input validation
- [x] Cancel workflow
- [x] WebP conversion
- [x] Download individual
- [x] Download ZIP
- [x] Mobile responsive
- [x] Clipboard paste
- [x] Accessibility

---

## 📚 Documentation

- **[README.md](README.md)** - This file (user guide)
- **[WORKFLOW_IMPLEMENTATION.md](WORKFLOW_IMPLEMENTATION.md)** - Technical implementation details
- **[WORKFLOW_TEST.md](WORKFLOW_TEST.md)** - Comprehensive testing guide
- **[CHANGES_SUMMARY.md](CHANGES_SUMMARY.md)** - Change log and modifications

---

## 🐛 Known Limitations

1. **Target KB applies per file** - Each file compressed to same target
2. **Quality floor enforced** - Won't compress below minimum quality
3. **Max dimensions fixed** - 5000px limit for performance
4. **Browser memory limits** - Very large batches may be slow

---

## 🔮 Future Enhancements

- [ ] Individual target KB per file
- [ ] Compression quality presets
- [ ] Before/after comparison slider
- [ ] Compression history
- [ ] More format support (GIF, SVG)
- [ ] Advanced options panel
- [ ] PWA support for offline use

---

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- Algorithm optimization
- Additional format support
- UI/UX enhancements
- Accessibility improvements
- Localization/i18n
- Performance optimization

---

## 📄 License

This project is provided as-is for educational and commercial use.

---

## 🙏 Credits

Built with:
- [browser-image-compression](https://github.com/Donaldcwl/browser-image-compression)
- [Compressor.js](https://github.com/fengyuanchen/compressorjs)
- [@jsquash/webp](https://github.com/jSquash/webp)
- [JSZip](https://stuk.github.io/jszip/)
- [FileSaver.js](https://github.com/eligrey/FileSaver.js/)

---

## 💬 Support

For issues or questions:
1. Check documentation files
2. Review test cases
3. Open an issue
4. Contact maintainers

---

## 🎉 Quick Links

- **Live Demo:** [Your deployed URL]
- **Documentation:** See docs folder
- **Issues:** GitHub Issues
- **Contributing:** CONTRIBUTING.md (if exists)

---

Made with ❤️ for the web

**Woofy Image Compressor** - Compress smart, not hard! 🐕
