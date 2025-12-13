document.addEventListener('DOMContentLoaded', () => {
    const codeInput = document.getElementById('codeInput');
    const highlightingContent = document.getElementById('highlighting-content');
    const explanationOutput = document.getElementById('explanationOutput');

    // --- UTILITY: Debounce ---
    // 
    // Prevents the function from running until you stop typing for 500ms.
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // --- CORE: Context-Aware Parser ---
    const explainLine = (line) => {
        const text = line.trim();
        if (!text) return null;

        // 1. COMMENT PASS-THROUGH
        // If the line is a comment, treat it as a header/explanation.
        if (text.startsWith('//')) {
            return `<strong style="color: #4CAF50;">NOTE:</strong> ${text.replace('//', '').trim()}`;
        }

        // 2. HTML SPECIFIC PARSING
        if (text.startsWith('<')) {
            if (text.match(/<!DOCTYPE/i)) return "Browser Instruction: Use HTML5 standards.";
            if (text.match(/<div/)) return "<strong>Container:</strong> Creates a generic division/section.";
            if (text.match(/<span/)) return "<strong>Inline Container:</strong> wraps text for styling without breaking lines.";
            if (text.match(/class="/)) return "<strong>Attribute:</strong> Assigns a class name for CSS styling.";
            if (text.match(/id="/)) return "<strong>Attribute:</strong> Assigns a unique ID for JavaScript targeting.";
            if (text.match(/<\/.*>/)) return "<strong>Closing Tag:</strong> Ends the previous element.";
        }

        // 3. JAVASCRIPT SPECIFIC PARSING
        
        // Variable Declaration Extraction
        // Pattern: const myVar = ...
        const varMatch = text.match(/(const|let|var)\s+(\w+)\s*=/);
        if (varMatch) {
            const type = varMatch[1] === 'const' ? 'constant (unchangeable)' : 'variable';
            const name = varMatch[2];
            
            if (text.includes('document.getElementById')) {
                return `<strong>DOM Selection:</strong> Finds the HTML element with ID and stores it in '${name}'.`;
            }
            if (text.includes('querySelector')) {
                return `<strong>DOM Selection:</strong> Finds the first CSS-selector match and stores it in '${name}'.`;
            }
            return `<strong>Declaration:</strong> Creates a ${type} named '${name}'.`;
        }

        // Function Logic
        if (text.match(/function\s+(\w+)/)) {
            const funcName = text.match(/function\s+(\w+)/)[1];
            return `<strong>Function Start:</strong> Defines a reusable block of logic named '${funcName}'.`;
        }
        if (text.includes('=>')) return "<strong>Arrow Function:</strong> A concise way to write a function.";

        // Event Listeners
        if (text.includes('.addEventListener')) {
            const eventType = text.match(/'(\w+)'/) ? text.match(/'(\w+)'/)[1] : 'event';
            return `<strong>Interaction:</strong> Listens for the '${eventType}' event (e.g., click/input) to trigger code.`;
        }

        // DOM Manipulation
        if (text.includes('.innerHTML')) return "<strong>Update UI:</strong> Replaces the HTML content inside the element.";
        if (text.includes('.textContent')) return "<strong>Update UI:</strong> Changes the raw text inside the element.";
        if (text.includes('.classList.add')) return "<strong>Style Logic:</strong> Adds a CSS class to the element to change its look.";
        if (text.includes('.style.')) return "<strong>Direct Styling:</strong> Modifies a specific CSS property directly via JS.";

        // Control Flow
        if (text.startsWith('if')) return "<strong>Condition:</strong> Checks if a statement is true before running the code block.";
        if (text.startsWith('return')) return "<strong>Output:</strong> Exits the function and sends a result back.";
        if (text.startsWith('}')) return "<strong>End Block:</strong> Closes the current function or loop.";

        // --- CSS SPECIFIC PARSING (Basic) ---
        if (text.includes('{')) return "<strong>Start Rule:</strong> Opens a new styling block.";
        if (text.includes(':') && text.includes(';')) {
            const parts = text.split(':');
            return `<strong>Style Property:</strong> Sets <code style="background:#444; padding:2px;">${parts[0].trim()}</code> to <em>${parts[1].replace(';', '').trim()}</em>.`;
        }

        // Fallback
        return "Executes code (Logic line)";
    };

    const updateInterface = () => {
        const code = codeInput.value;

        // Escape HTML for the highlighter overlay
        highlightingContent.innerHTML = code
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        
        Prism.highlightElement(highlightingContent);

        const lines = code.split('\n');
        explanationOutput.innerHTML = ''; 

        lines.forEach((line, index) => {
            const explanation = explainLine(line);
            
            if (explanation) {
                const item = document.createElement('div');
                item.className = 'line-explanation';
                // Add a specific class if it's a comment for styling
                const isComment = line.trim().startsWith('//');
                
                item.innerHTML = `
                    <span class="line-number" style="${isComment ? 'color: #4CAF50;' : ''}">Line ${index + 1}</span>
                    <div class="text">
                        <span class="code-snippet">${line.substring(0, 40)}${line.length > 40 ? '...' : ''}</span>
                        <div class="explainer-text">${explanation}</div>
                    </div>
                `;
                explanationOutput.appendChild(item);
            }
        });
    };

    codeInput.addEventListener('input', debounce(updateInterface, 500));

    // Scroll Sync
    codeInput.addEventListener('scroll', () => {
        const wrapper = codeInput.closest('.editor-wrapper');
        const pre = wrapper.querySelector('pre');
        pre.scrollTop = codeInput.scrollTop;
        pre.scrollLeft = codeInput.scrollLeft;
    });
});
