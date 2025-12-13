document.addEventListener('DOMContentLoaded', () => {
    // These get the actual HTML elements from the DOM so we can control them
    const codeInput = document.getElementById('codeInput');
    const highlightingContent = document.getElementById('highlighting-content');
    const explanationOutput = document.getElementById('explanationOutput');

    // --- UTILITY: Debounce ---
    // 
    // PURPOSE: Performance optimization.
    // Without this, the app would crash trying to explain every single letter you type.
    // It forces the code to wait until you *stop* typing for 500ms.
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // --- CORE: The Logic Engine ---
    const explainLine = (line) => {
        const text = line.trim();
        if (!text) return null;

        // 1. COMMENTS (The Developer's Voice)
        if (text.startsWith('//')) {
            return `<span style="color:#4CAF50; font-weight:bold;">📝 ARCHITECTURE NOTE:</span> ${text.replace('//', '')}`;
        }

        // 2. PROJECT-SPECIFIC LOGIC (Self-Awareness)
        // This section explains THIS app's specific variables.
        
        // Input Handling
        if (text.includes('codeInput.value')) return "<strong>Data Fetch:</strong> Grabs the raw text you just typed into the left panel.";
        if (text.includes('codeInput.addEventListener')) return "<strong>Trigger:</strong> Watch for typing ('input') or scrolling ('scroll').";
        
        // Syntax Highlighting Logic
        if (text.includes('highlightingContent')) return "<strong>Visual Layer:</strong> Refers to the hidden background layer that handles the colors.";
        if (text.includes('Prism.highlightElement')) return "<strong>Library Call:</strong> Asks Prism.js to repaint the colors based on the new code.";
        if (text.includes('replace(/&/g')) return "<strong>Sanitization:</strong> Prevents code injection by turning special characters into safe HTML entities.";
        
        // Output Logic
        if (text.includes('explanationOutput')) return "<strong>Target Container:</strong> The right-side panel where these explanation blocks are inserted.";
        if (text.includes('explanationOutput.innerHTML = \'\'')) return "<strong>Reset:</strong> Wipes the right panel clean before adding the new explanations.";
        if (text.includes('explanationOutput.appendChild')) return "<strong>Render:</strong> Inserts a newly generated explanation block into the DOM.";

        // 3. GENERAL PATTERNS (With "Vibe" Context)
        
        // HTML Tags
        if (text.match(/<div/)) return "<strong>Structure:</strong> Creates a box/container. Change the 'class' to change how it looks.";
        if (text.match(/<span/)) return "<strong>Styling Wrapper:</strong> Wraps a small piece of text (like a keyword) to apply color.";
        if (text.match(/class="/)) return "<strong>CSS Hook:</strong> Links this element to the stylesheet. This is how it gets its 'Vibe'.";

        // JS Logic
        if (text.includes('const ') || text.includes('let ')) {
            const varName = text.split(' ')[1];
            return `<strong>Memory:</strong> Creates a box named <code>${varName}</code> to save data for later use.`;
        }
        if (text.includes('if (!text)')) return "<strong>Guard Clause:</strong> If the line is empty, stop immediately to save processing power.";
        if (text.includes('=>')) return "<strong>Action:</strong> Defines a mini-function to do a specific task.";
        if (text.includes('return')) return "<strong>Result:</strong> Finishes the calculation and hands back the answer.";

        // CSS Logic
        if (text.includes('display: flex')) return "<strong>Layout Engine:</strong> Activates Flexbox, allowing you to align items in rows or columns easily.";
        if (text.includes('color:')) return "<strong>Aesthetics:</strong> Changes the text color.";
        if (text.includes('background:')) return "<strong>Aesthetics:</strong> Changes the background color or texture.";

        // Fallback
        return "<strong>Logic Step:</strong> Standard code execution.";
    };

    const updateInterface = () => {
        const code = codeInput.value;

        // Step 1: Handle the visual syntax highlighting
        // We manually escape HTML characters so they display as text, not run as code.
        highlightingContent.innerHTML = code
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        
        Prism.highlightElement(highlightingContent);

        // Step 2: Generate Explanations
        const lines = code.split('\n');
        explanationOutput.innerHTML = ''; 

        lines.forEach((line, index) => {
            const explanation = explainLine(line);
            
            if (explanation) {
                const item = document.createElement('div');
                item.className = 'line-explanation';
                item.innerHTML = `
                    <span class="line-number">Line ${index + 1}</span>
                    <div class="text">
                        <span class="code-snippet">${line.substring(0, 40)}${line.length > 40 ? '...' : ''}</span>
                        <div class="explainer-text">${explanation}</div>
                    </div>
                `;
                explanationOutput.appendChild(item);
            }
        });
    };

    // Attach the Debounce logic to the input
    // "Wait 500ms after the last keystroke before updating"
    codeInput.addEventListener('input', debounce(updateInterface, 500));

    // Scroll Sync: This ensures the text and the colors move together
    codeInput.addEventListener('scroll', () => {
        const wrapper = codeInput.closest('.editor-wrapper');
        const pre = wrapper.querySelector('pre');
        pre.scrollTop = codeInput.scrollTop;
        pre.scrollLeft = codeInput.scrollLeft;
    });
});
