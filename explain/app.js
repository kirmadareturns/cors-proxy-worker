document.addEventListener('DOMContentLoaded', () => {
    const codeInput = document.getElementById('codeInput');
    const highlightingContent = document.getElementById('highlighting-content');
    const explanationOutput = document.getElementById('explanationOutput');

    // 1. Debounce Utility
    // Prevents the parser from running on every single keystroke.
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // 2. The Heuristic Parsing Engine
    // This maps code patterns to plain English.
    const explainLine = (line) => {
        line = line.trim();
        if (!line) return null; // Skip empty lines

        // --- HTML RULES ---
        if (line.match(/<!DOCTYPE html>/i)) return "Defines this document as an HTML5 file.";
        if (line.match(/<html/i)) return "The root element of the HTML page.";
        if (line.match(/<head/i)) return "Container for metadata (title, scripts, styles) that isn't displayed.";
        if (line.match(/<body/i)) return "Contains all the visible content of the web page.";
        if (line.match(/<div/i)) return "Defines a division or section in the document.";
        if (line.match(/<script/i)) return "Embeds or references executable JavaScript code.";
        if (line.match(/<\/.*>/)) return `Closes the previously opened HTML element.`;

        // --- CSS RULES ---
        if (line.match(/color\s*:/)) return "Sets the color of the text.";
        if (line.match(/background\s*:/)) return "Sets the background color or image.";
        if (line.match(/margin\s*:/)) return "Sets the space outside the element's border.";
        if (line.match(/padding\s*:/)) return "Sets the space inside the element's border.";
        if (line.match(/display\s*:\s*flex/)) return "Enables Flexbox layout for aligning items efficiently.";
        if (line.match(/\{/)) return "Opens a CSS rule block or a JavaScript code block.";
        if (line.match(/\}/)) return "Ends the current code block.";

        // --- JAVASCRIPT RULES ---
        if (line.match(/const\s+\w+/)) return "Declares a read-only variable (constant).";
        if (line.match(/let\s+\w+/)) return "Declares a block-scoped local variable.";
        if (line.match(/function\s+\w+/)) return "Defines a new function (a reusable block of code).";
        if (line.match(/console\.log/)) return "Prints a message to the browser's developer console for debugging.";
        if (line.match(/document\.getElementById/)) return "Finds an HTML element on the page using its unique ID.";
        if (line.match(/addEventListener/)) return "Sets up a function to run when a specific event (like a click) happens.";
        if (line.match(/=>/)) return "Defines an Arrow Function (a shorter syntax for writing functions).";
        if (line.match(/return\s+/)) return "Stops the function execution and sends a value back.";

        // Fallback for unknown lines
        return "Executes a statement or defines structure (Pattern not recognized).";
    };

    // 3. Main Update Function
    const updateInterface = () => {
        const code = codeInput.value;

        // Update Syntax Highlighting
        // We replace newlines with <br> for the pre tag to render correctly
        highlightingContent.innerHTML = code
            .replace(new RegExp("&", "g"), "&amp;")
            .replace(new RegExp("<", "g"), "&lt;"); 
        
        // Trigger Prism.js highlight
        Prism.highlightElement(highlightingContent);

        // Generate Explanations
        const lines = code.split('\n');
        explanationOutput.innerHTML = ''; // Clear previous

        lines.forEach((line, index) => {
            const explanation = explainLine(line);
            
            // Only render if there is an explanation (skips empty lines)
            if (explanation) {
                const item = document.createElement('div');
                item.className = 'line-explanation';
                item.innerHTML = `
                    <span class="line-number">Line ${index + 1}</span>
                    <div class="text">
                        <span class="code-snippet">${line.substring(0, 30)}${line.length > 30 ? '...' : ''}</span>
                        ${explanation}
                    </div>
                `;
                explanationOutput.appendChild(item);
            }
        });
    };

    // 4. Event Listener with Debounce
    // Wait 500ms after typing stops before running the parser
    codeInput.addEventListener('input', debounce(updateInterface, 500));

    // 5. Scroll Sync
    // Syncs the scroll of the textarea and the highlighting pre block
    codeInput.addEventListener('scroll', () => {
        const wrapper = codeInput.closest('.editor-wrapper');
        const pre = wrapper.querySelector('pre');
        pre.scrollTop = codeInput.scrollTop;
        pre.scrollLeft = codeInput.scrollLeft;
    });
});
