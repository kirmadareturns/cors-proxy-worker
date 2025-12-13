document.addEventListener('DOMContentLoaded', () => {
    const codeInput = document.getElementById('codeInput');
    const highlightingContent = document.getElementById('highlighting-content');
    const explanationOutput = document.getElementById('explanationOutput');
    const healthStatus = document.getElementById('healthStatus');

    // --- 1. MEMORY & STATE ---
    let memory = new Set(); // Stores variable names to simulate "recognition"

    // --- 2. DEBOUNCE (Performance) ---
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // --- 3. THE "AI" ENGINE ---
    const runAnalysis = () => {
        const code = codeInput.value;
        const lines = code.split('\n');
        
        // A. RESET UI
        explanationOutput.innerHTML = '';
        memory.clear();
        
        // B. RUN JSHINT (The Doctor)
        // JSHINT is a library that finds errors.
        JSHINT(code, { esversion: 6 });
        const errors = JSHINT.errors || [];
        
        // Update Health Badge
        if (errors.length > 0) {
            healthStatus.className = 'health-badge issue';
            healthStatus.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${errors.length} Issues Found`;
        } else {
            healthStatus.className = 'health-badge healthy';
            healthStatus.innerHTML = `<i class="fa-solid fa-check"></i> Code Healthy`;
        }

        // C. LINE-BY-LINE NARRATIVE
        lines.forEach((line, i) => {
            const lineNum = i + 1;
            const text = line.trim();
            if (!text || text.startsWith('//')) return;

            // 1. Check for Errors on this line
            const lineError = errors.find(e => e && e.line === lineNum);
            
            // 2. Generate Contextual Explanation
            let insight = generateInsight(text, lineNum, lineError);

            // 3. Render Card
            const card = document.createElement('div');
            card.className = lineError ? 'insight-card error-card' : 'insight-card';
            card.innerHTML = insight;
            
            // Add tooltip behavior (using Tippy.js)
            card.setAttribute('data-tippy-content', 'Click to highlight this line in editor');
            
            explanationOutput.appendChild(card);
        });
        
        // Initialize Tooltips
        tippy('[data-tippy-content]');
    };

    // --- 4. THE NARRATIVE LOGIC (The Voice) ---
    const generateInsight = (text, lineNum, error) => {
        // [Image of computer bug illustration]
        // IF ERROR FOUND
        if (error) {
            return `
                <span class="line-ref">Line ${lineNum}</span>
                <span class="insight-title" style="color: #ff6b6b;"><i class="fa-solid fa-bug"></i> Critical Issue</span>
                <div class="insight-body">
                    The code reviewer found a problem here: <strong>${error.reason}</strong>.
                    <br><em>This line might break your app. Check syntax (like missing brackets or semicolons).</em>
                </div>
            `;
        }

        // HTML PARSING
        if (text.startsWith('<')) {
            if (text.includes('class=')) {
                const cls = text.match(/class="([^"]+)"/)?.[1] || 'style';
                return `
                    <span class="line-ref">Line ${lineNum}</span>
                    <span class="insight-title"><i class="fa-brands fa-html5"></i> Structure (Container)</span>
                    <div class="insight-body">
                        You are building a box with the nametag <strong>"${cls}"</strong>.
                        <div class="tip-box">
                            <span class="tip-label">CUSTOMIZATION</span>
                            Go to your CSS and look for <code>.${cls}</code>. Changing settings there will change how this specific box looks.
                        </div>
                    </div>
                `;
            }
            return `
                <span class="line-ref">Line ${lineNum}</span>
                <span class="insight-title"><i class="fa-solid fa-code"></i> HTML Element</span>
                <div class="insight-body">You are placing a generic element on the page.</div>
            `;
        }

        // CSS PARSING
        if (text.includes(':') && text.includes(';')) {
            const [prop, val] = text.split(':');
            return `
                <span class="line-ref">Line ${lineNum}</span>
                <span class="insight-title"><i class="fa-brands fa-css3-alt"></i> Style Rule</span>
                <div class="insight-body">
                    Setting <strong>${prop.trim()}</strong> to <strong>${val.replace(';', '').trim()}</strong>.
                    <div class="tip-box">
                        <span class="tip-label">VIBE CHECK</span>
                        ${getCSSTip(prop.trim())}
                    </div>
                </div>
            `;
        }

        // JAVASCRIPT LOGIC
        // Variable Declaration
        const varMatch = text.match(/(const|let|var)\s+(\w+)\s*=/);
        if (varMatch) {
            const name = varMatch[2];
            memory.add(name); // Remember this!
            
            // DOM Selection Context
            if (text.includes('document.get') || text.includes('querySelector')) {
                return `
                    <span class="line-ref">Line ${lineNum}</span>
                    <span class="insight-title"><i class="fa-solid fa-link"></i> DOM Connection</span>
                    <div class="insight-body">
                        You are linking the HTML element to the variable <strong>${name}</strong>.
                        <div class="tip-box">
                            <span class="tip-label">CUSTOMIZATION</span>
                            If you want to control a different element, change the ID/Class inside the quotes.
                        </div>
                    </div>
                `;
            }

            return `
                <span class="line-ref">Line ${lineNum}</span>
                <span class="insight-title"><i class="fa-solid fa-memory"></i> New Memory</span>
                <div class="insight-body">
                    Creating a smart label named <strong>${name}</strong> to save data.
                    <div class="tip-box">
                        <span class="tip-label">CUSTOMIZATION</span>
                        Change the value after the <code>=</code> sign to update the starting data of your app.
                    </div>
                </div>
            `;
        }

        // Function
        if (text.includes('function') || text.includes('=>')) {
            return `
                <span class="line-ref">Line ${lineNum}</span>
                <span class="insight-title"><i class="fa-solid fa-gears"></i> Action Recipe</span>
                <div class="insight-body">
                    This block defines a new ability for your app. It won't run immediately; it waits to be called.
                </div>
            `;
        }

        // Event Listener
        if (text.includes('addEventListener')) {
            const evt = text.match(/'(\w+)'/)?.[1] || 'event';
            return `
                <span class="line-ref">Line ${lineNum}</span>
                <span class="insight-title"><i class="fa-solid fa-computer-mouse"></i> User Trigger</span>
                <div class="insight-body">
                    <strong>Waiting for ${evt}:</strong> The code inside here only runs when the user performs this action.
                    <div class="tip-box">
                        <span class="tip-label">TRY THIS</span>
                        Change <code>'${evt}'</code> to <code>'dblclick'</code> to make it require a double click.
                    </div>
                </div>
            `;
        }

        // Fallback checks
        // Check if using a known variable
        for (let knownVar of memory) {
            if (text.includes(knownVar)) {
                return `
                    <span class="line-ref">Line ${lineNum}</span>
                    <span class="insight-title"><i class="fa-solid fa-rotate"></i> Update Logic</span>
                    <div class="insight-body">
                        Modifying or using the data from <strong>${knownVar}</strong>.
                    </div>
                `;
            }
        }

        return `
            <span class="line-ref">Line ${lineNum}</span>
            <span class="insight-title"><i class="fa-solid fa-terminal"></i> Logic Execution</span>
            <div class="insight-body">Processing a command. Ensure syntax is correct.</div>
        `;
    };

    // Helper for CSS Tips
    const getCSSTip = (prop) => {
        if (prop.includes('color')) return "Change the hex code (e.g., #000) to recolor.";
        if (prop.includes('size') || prop.includes('width')) return "Increase the number to make it bigger.";
        if (prop.includes('margin') || prop.includes('padding')) return "Increase this to add more breathing room.";
        return "Tweak this value to change the design feel.";
    };

    // --- 5. UI UPDATERS ---
    const updateInterface = () => {
        const code = codeInput.value;
        // Highlight
        highlightingContent.innerHTML = code
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        Prism.highlightElement(highlightingContent);
        // Analyze
        runAnalysis();
    };

    // Scroll Sync
    // [Image of dual scrollbar synchronization]
    codeInput.addEventListener('scroll', () => {
        const wrapper = codeInput.closest('.editor-wrapper');
        wrapper.querySelector('pre').scrollTop = codeInput.scrollTop;
        wrapper.querySelector('pre').scrollLeft = codeInput.scrollLeft;
    });

    codeInput.addEventListener('input', debounce(updateInterface, 800)); // 800ms wait for JSHint to breathe
});
