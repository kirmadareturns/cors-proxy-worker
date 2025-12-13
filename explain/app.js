document.addEventListener('DOMContentLoaded', () => {
    const codeInput = document.getElementById('codeInput');
    const highlightingContent = document.getElementById('highlighting-content');
    const explanationOutput = document.getElementById('explanationOutput');
    const healthStatus = document.getElementById('healthStatus');

    // --- 1. THE JARGON DICTIONARY ---
    // This translates "Dev Speak" into "Human Speak"
    const terms = {
        'bg': 'Background Color',
        'btn': 'Button',
        'nav': 'Navigation Bar',
        'col': 'Column',
        'container': 'Content Box',
        'wrapper': 'Outer Holder',
        'flex': 'Auto-Layout',
        'grid': 'Grid Layout',
        'justify': 'Alignment',
        'align': 'Positioning',
        'gap': 'Spacing between items',
        'border': 'Outline',
        'radius': 'Rounded Corners',
        'font': 'Typography',
        'src': 'Source File',
        'href': 'Web Link',
        'div': 'Section',
        'span': 'Text Wrapper',
        'img': 'Image',
        'ul': 'List',
        'li': 'List Item',
        'p': 'Paragraph',
        'h1': 'Main Headline',
        'h2': 'Sub-headline',
        'const': 'Fixed Value',
        'let': 'Changeable Value',
        'var': 'Variable',
        'func': 'Action',
        'init': 'Start Up',
        'accent': 'Main Highlight Color',
        'primary': 'Main Brand Color',
        'secondary': 'Secondary Brand Color'
    };

    // --- 2. UTILITY: Humanizer ---
    // Turns "bg-panel" into "Background Color of the Panel"
    const humanize = (text) => {
        // Remove symbols like --, ., #
        let clean = text.replace(/[-_#.]/g, ' ').trim();
        
        // Split into words
        let words = clean.split(' ');
        
        // Translate each word using our dictionary
        let translated = words.map(word => {
            // Check dictionary (case insensitive)
            const key = word.toLowerCase();
            return terms[key] || word; // Return translation OR original word
        });

        // Join back together
        return translated.join(' ');
    };

    // --- 3. UTILITY: Language Detector ---
    const detectLanguage = (code) => {
        if (code.trim().startsWith('<')) return 'HTML';
        if (code.includes('{') && code.includes(':') && !code.includes('function') && !code.includes('const')) return 'CSS';
        return 'JS';
    };

    // --- 4. DEBOUNCE ---
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // --- 5. THE ANALYZER ENGINE ---
    const runAnalysis = () => {
        const code = codeInput.value;
        const language = detectLanguage(code);
        const lines = code.split('\n');
        
        explanationOutput.innerHTML = '';
        
        // ONLY Run JSHint if it is actually JavaScript
        let errors = [];
        if (language === 'JS') {
            JSHINT(code, { esversion: 6 });
            errors = JSHINT.errors || [];
        }
        
        // Update Status Badge
        if (errors.length > 0) {
            healthStatus.className = 'health-badge issue';
            healthStatus.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${errors.length} Issues Found`;
        } else {
            healthStatus.className = 'health-badge healthy';
            healthStatus.innerHTML = `<i class="fa-solid fa-check"></i> ${language} Detected`;
        }

        lines.forEach((line, i) => {
            const lineNum = i + 1;
            const text = line.trim();
            if (!text || text.startsWith('//') || text.startsWith('/*')) return;

            const lineError = errors.find(e => e && e.line === lineNum);
            
            // Generate Explanation based on detected language
            let insight = '';
            if (language === 'CSS') insight = explainCSS(text, lineNum);
            else if (language === 'HTML') insight = explainHTML(text, lineNum);
            else insight = explainJS(text, lineNum, lineError);

            // Render
            const card = document.createElement('div');
            card.className = lineError ? 'insight-card error-card' : 'insight-card';
            card.innerHTML = insight;
            explanationOutput.appendChild(card);
        });
        
        tippy('[data-tippy-content]');
    };

    // --- 6. TRANSLATION LOGIC ---

    const explainCSS = (text, lineNum) => {
        // Handle CSS Variables (e.g., --bg-panel: #000)
        if (text.startsWith('--')) {
            const parts = text.split(':');
            const property = parts[0].trim(); // --bg-panel
            const value = parts[1]?.replace(';', '').trim(); // #000
            
            const humanProp = humanize(property);

            return `
                <span class="line-ref">Line ${lineNum}</span>
                <span class="insight-title"><i class="fa-solid fa-palette"></i> Theme Setting</span>
                <div class="insight-body">
                    You are defining the <strong>${humanProp}</strong>.
                    <br>Currently set to: <strong style="border-bottom: 2px solid ${value};">${value}</strong>.
                    <div class="tip-box">
                        <span class="tip-label">MAKE IT YOURS</span>
                        Change <code>${value}</code> to any other color to update the ${humanProp} across the whole site.
                    </div>
                </div>
            `;
        }

        // Handle Standard CSS Rules (e.g., background-color: red)
        if (text.includes(':') && text.includes(';')) {
            const parts = text.split(':');
            const prop = parts[0].trim();
            const val = parts[1].replace(';', '').trim();
            const humanProp = humanize(prop);

            return `
                <span class="line-ref">Line ${lineNum}</span>
                <span class="insight-title"><i class="fa-brands fa-css3-alt"></i> Style Rule</span>
                <div class="insight-body">
                    This controls the <strong>${humanProp}</strong>.
                    <div class="tip-box">
                        <span class="tip-label">TRY THIS</span>
                        ${getCSSAdvice(prop, val)}
                    </div>
                </div>
            `;
        }
        
        // Handle Selectors (e.g., .panel { )
        if (text.includes('{')) {
            const selector = text.replace('{', '').trim();
            const humanSelector = humanize(selector);
            return `
                <span class="line-ref">Line ${lineNum}</span>
                <span class="insight-title"><i class="fa-solid fa-bullseye"></i> Target</span>
                <div class="insight-body">
                    <strong>Starting a new section:</strong> Any rules below this line will apply to the <strong>"${humanSelector}"</strong>.
                </div>
            `;
        }

        return `<span class="line-ref">Line ${lineNum}</span><div class="insight-body">Styling structure.</div>`;
    };

    const explainHTML = (text, lineNum) => {
        if (text.match(/<(\w+)/)) {
            const tag = text.match(/<(\w+)/)[1];
            const humanTag = terms[tag] || tag; // Translate 'div' to 'Section', 'img' to 'Image'
            
            return `
                <span class="line-ref">Line ${lineNum}</span>
                <span class="insight-title"><i class="fa-brands fa-html5"></i> Structure</span>
                <div class="insight-body">
                    You are placing a <strong>${humanTag}</strong> here.
                    ${text.includes('class=') ? '<br>It uses a class for styling (check your CSS).' : ''}
                </div>
            `;
        }
        return `<span class="line-ref">Line ${lineNum}</span><div class="insight-body">HTML Structure.</div>`;
    };

    const explainJS = (text, lineNum, error) => {
        if (error) {
             return `
                <span class="line-ref">Line ${lineNum}</span>
                <span class="insight-title" style="color:#ff4757;"><i class="fa-solid fa-bug"></i> Critical Error</span>
                <div class="insight-body">
                    JSHint found an issue: ${error.reason}. <br><em>Check for typos or missing brackets.</em>
                </div>
            `;
        }

        if (text.includes('const') || text.includes('let') || text.includes('var')) {
             const parts = text.split('=');
             const varName = parts[0].replace(/(const|let|var)/, '').trim();
             const humanName = humanize(varName); // Turns 'userScore' to 'User Score'

             return `
                <span class="line-ref">Line ${lineNum}</span>
                <span class="insight-title"><i class="fa-solid fa-memory"></i> Memory Slot</span>
                <div class="insight-body">
                    Creating a value called <strong>"${humanName}"</strong>.
                    <br>Value: <code>${parts[1]?.replace(';', '').trim()}</code>
                </div>
            `;
        }
        
        return `<span class="line-ref">Line ${lineNum}</span><div class="insight-body">Logic calculation.</div>`;
    };

    // --- 7. ADVICE GENERATOR ---
    const getCSSAdvice = (prop, val) => {
        if (prop.includes('color') || prop.includes('background')) return "Change the hex code to recolor this element.";
        if (prop.includes('width') || prop.includes('height')) return "Increase the number to make this element bigger.";
        if (prop.includes('margin')) return "Increase this number to push other items further away (more space).";
        if (prop.includes('padding')) return "Increase this number to make the box fatter on the inside.";
        if (prop.includes('font')) return "Change the font name or size to update the text style.";
        if (prop.includes('display') && val.includes('flex')) return "This aligns items in a row. Change 'flex' to 'block' to stack them.";
        return "Tweak this value to see how the design changes.";
    };

    // --- 8. INIT ---
    const updateInterface = () => {
        const code = codeInput.value;
        highlightingContent.innerHTML = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        Prism.highlightElement(highlightingContent);
        runAnalysis();
    };

    codeInput.addEventListener('scroll', () => {
        codeInput.closest('.editor-wrapper').querySelector('pre').scrollTop = codeInput.scrollTop;
    });

    codeInput.addEventListener('input', debounce(updateInterface, 500));
});
