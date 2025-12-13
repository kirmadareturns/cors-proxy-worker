document.addEventListener('DOMContentLoaded', () => {
    // LINKS TO THE HTML ELEMENTS
    const codeInput = document.getElementById('codeInput');
    const highlightingContent = document.getElementById('highlighting-content');
    const explanationOutput = document.getElementById('explanationOutput');

    // --- UTILITY: Debounce ---
    // 
    // PURPOSE: Prevents the app from freezing. It waits for you to stop typing (500ms) before processing.
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // --- THE TRANSLATOR ENGINE ---
    // This function looks at the code line-by-line and decides what "Instruction" to give.
    const explainLine = (line) => {
        const text = line.trim();
        
        // 1. SKIP EMPTY LINES OR COMMENTS
        // If the line is empty OR starts with //, we return null immediately.
        // This ensures the explanation panel only shows actual code.
        if (!text || text.startsWith('//')) return null;

        // 2. CSS: The "Paint" Layer (Styling)
        if (text.includes(':')) {
            if (text.match(/color:|background:|fill:/)) {
                return `<strong>🎨 AESTHETIC:</strong> Controls color. <br><em>Try changing the hex code (e.g. #000) or name.</em>`;
            }
            if (text.match(/margin:|padding:|gap:/)) {
                return `<strong>📐 SPACING:</strong> Controls distance. <br><em>Increase the number to add more whitespace.</em>`;
            }
            if (text.match(/width:|height:|font-size:/)) {
                return `<strong>📏 SIZE:</strong> Controls dimension. <br><em>Change the number to resize this element.</em>`;
            }
            if (text.includes('display: flex')) {
                return `<strong>🧩 LAYOUT:</strong> Uses 'Flexbox'. <br><em>Aligns items in rows/columns automatically.</em>`;
            }
            if (text.includes('border:')) {
                return `<strong>🖼️ BORDER:</strong> Adds a line around the box. <br><em>Change 'solid' to 'dashed' or increase the 'px'.</em>`;
            }
        }

        // 3. HTML: The "Skeleton" Layer (Structure)
        // 
        if (text.startsWith('<')) {
            if (text.match(/<div|<section|<main|<header|<footer/)) {
                return `<strong>📦 BOX:</strong> A structural container. <br><em>Holds other elements inside it.</em>`;
            }
            if (text.match(/<h[1-6]|<p|<span|<a/)) {
                return `<strong>📄 TEXT/LINK:</strong> Visible content. <br><em>Text inside here appears on the screen.</em>`;
            }
            if (text.match(/class="/)) {
                const className = text.match(/class="([^"]+)"/)[1];
                return `<strong>🏷️ NAMETAG:</strong> Assigns class <code>.${className}</code>. <br><em>Go to CSS and style <code>.${className}</code> to change the vibe.</em>`;
            }
            if (text.match(/id="/)) {
                const idName = text.match(/id="([^"]+)"/)[1];
                return `<strong>🔑 UNIQUE ID:</strong> Names this <code>#${idName}</code>. <br><em>JavaScript uses this ID to control this specific element.</em>`;
            }
            if (text.match(/<img/)) {
                return `<strong>🖼️ IMAGE:</strong> Displays a picture. <br><em>Change the 'src' link to swap the image.</em>`;
            }
        }

        // 4. JAVASCRIPT: The "Brain" Layer (Logic)
        // 
        
        // Variables
        if (text.match(/(const|let|var)\s+(\w+)\s*=/)) {
            const match = text.match(/(const|let|var)\s+(\w+)\s*=/);
            return `<strong>🧠 MEMORY:</strong> Saves data into a label named <strong>'${match[2]}'</strong>. <br><em>Use this name later to retrieve this data.</em>`;
        }
        
        // DOM Selection
        if (text.includes('getElementById') || text.includes('querySelector')) {
            return `<strong>🪝 THE HOOK:</strong> Grabs an HTML element. <br><em>Allows JavaScript to read or change that element.</em>`;
        }
        
        // Event Listeners
        if (text.includes('addEventListener')) {
            return `<strong>👂 THE TRIGGER:</strong> Waits for an interaction (like 'click'). <br><em>The code inside runs ONLY when this happens.</em>`;
        }
        
        // Content Updates
        if (text.includes('.innerHTML') || text.includes('.innerText') || text.includes('.textContent')) {
            return `<strong>✏️ UPDATE:</strong> Overwrites content. <br><em>Replaces what the user sees on screen.</em>`;
        }
        
        // Conditions
        if (text.startsWith('if')) {
            return `<strong>🚧 DECISION:</strong> A Gateway. <br><em>Checks if a condition is true before running the code inside.</em>`;
        }
        
        // Functions
        if (text.includes('function') || text.includes('=>')) {
            return `<strong>⚙️ ACTION:</strong> Defines a reusable task. <br><em>This code doesn't run yet; it waits to be called.</em>`;
        }

        // Fallback for generic code
        return "<strong>💻 LOGIC:</strong> Standard code execution.";
    };

    const updateInterface = () => {
        const code = codeInput.value;

        // 1. Update the background syntax highlighter (Prism.js)
        highlightingContent.innerHTML = code
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        Prism.highlightElement(highlightingContent);

        // 2. Generate Explanations
        const lines = code.split('\n');
        explanationOutput.innerHTML = ''; 

        lines.forEach((line, index) => {
            const explanation = explainLine(line);
            
            // CRITICAL: If explanation is null (comment/empty), we do NOT create a div.
            if (!explanation) return;

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
        });
    };

    // --- SCROLL SYNC LOGIC (Bi-Directional) ---
    // These flags prevent an infinite loop where Left scrolls Right, which scrolls Left, etc.
    let isSyncingLeft = false;
    let isSyncingRight = false;

    // 1. Master Scroll: Input Area (Left) -> Explanation Area (Right)
    codeInput.addEventListener('scroll', function() {
        if (!isSyncingLeft) {
            isSyncingRight = true;
            // Calculate what % down the page we are
            const percentage = this.scrollTop / (this.scrollHeight - this.offsetHeight);
            // Scroll the right side to the same %
            explanationOutput.scrollTop = percentage * (explanationOutput.scrollHeight - explanationOutput.offsetHeight);
        }
        isSyncingLeft = false;

        // Sync the Syntax Highlighter (Behind the textarea)
        const wrapper = codeInput.closest('.editor-wrapper');
        const pre = wrapper.querySelector('pre');
        pre.scrollTop = this.scrollTop;
        pre.scrollLeft = this.scrollLeft;
    });

    // 2. Slave Scroll: Explanation Area (Right) -> Input Area (Left)
    explanationOutput.addEventListener('scroll', function() {
        if (!isSyncingRight) {
            isSyncingLeft = true;
            const percentage = this.scrollTop / (this.scrollHeight - this.offsetHeight);
            codeInput.scrollTop = percentage * (codeInput.scrollHeight - codeInput.offsetHeight);
        }
        isSyncingRight = false;
    });

    // --- INITIALIZATION ---
    // Listen for typing, but use 'debounce' to wait 500ms before running
    codeInput.addEventListener('input', debounce(updateInterface, 500));
});
