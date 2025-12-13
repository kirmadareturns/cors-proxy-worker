document.addEventListener('DOMContentLoaded', () => {
    const codeInput = document.getElementById('codeInput');
    const highlightingContent = document.getElementById('highlighting-content');
    const explanationOutput = document.getElementById('explanationOutput');

    // --- 1. THE CONCEPT ENGINE ---
    // Instead of translating words, we identify "Intent"
    const analyzeLine = (line) => {
        const text = line.trim();
        if (!text || text.startsWith('//') || text.startsWith('/*')) return null;

        // --- CSS CONCEPTS ---
        if (text.includes(':')) {
            const [prop, val] = text.split(':');
            const cleanVal = val.replace(';', '').trim();

            // 1. AESTHETICS (Color & Background)
            if (prop.match(/color|background|fill|stroke/)) {
                return {
                    title: "🎨 Aesthetics & Theme",
                    desc: `You are painting this element with a specific color.`,
                    tweak: `Change <code>${cleanVal}</code> to a hex code like <code>#ff0055</code> (Pink) or <code>#000</code> (Black) to completely change the vibe.`
                };
            }

            // 2. LAYOUT (Flexbox/Grid)
            if (val.includes('flex') || val.includes('grid')) {
                return {
                    title: "🧩 The Layout Engine",
                    desc: `You are activating a Smart Layout system. This tells the browser: "Don't just stack things; arrange them intelligently."`,
                    tweak: `If you delete this line, your layout will break and elements will just stack on top of each other.`
                };
            }

            // 3. SPACING (Margin/Padding/Gap)
            if (prop.match(/margin|padding|gap/)) {
                return {
                    title: "📐 Breathing Room",
                    desc: `You are controlling the empty space around the content.`,
                    tweak: `Increase <code>${cleanVal}</code> (e.g., double it) to make the design feel more open and clean. Decrease it to make it compact.`
                };
            }

            // 4. TYPOGRAPHY (Fonts)
            if (prop.match(/font-|text-align/)) {
                return {
                    title: "abc Typography",
                    desc: `You are controlling how the text looks and reads.`,
                    tweak: `Try changing the font size or family to match your brand's style.`
                };
            }
            
            // 5. SIZE (Width/Height)
            if (prop.match(/width|height/)) {
                return {
                    title: "📏 Dimensions",
                    desc: `You are forcing this element to be a specific size.`,
                    tweak: `Be careful! Fixed sizes like <code>${cleanVal}</code> can break on mobile phones. Consider using percentages (e.g., 100%) instead.`
                };
            }

            return { title: "💅 Styling Rule", desc: "A standard visual rule.", tweak: "Change the value to adjust the look." };
        }

        // --- HTML CONCEPTS ---
        if (text.startsWith('<')) {
            if (text.match(/<div|<section|<main|<header|<footer/)) {
                const className = text.match(/class="([^"]+)"/)?.[1];
                return {
                    title: "📦 Structural Box",
                    desc: `You are building a container to hold other items.${className ? ` It has the nametag <strong>"${className}"</strong>.` : ''}`,
                    tweak: className ? `Go to your CSS and find <code>.${className}</code> to style this specific box.` : `Add <code>class="my-box"</code> so you can style it later.`
                };
            }
            if (text.match(/<img|<video/)) {
                return {
                    title: "🖼️ Media Asset",
                    desc: `You are embedding an image or video file.`,
                    tweak: `Change the <code>src="..."</code> link to swap the image.`
                };
            }
            if (text.match(/<h[1-6]|<p|<span|<a|<button/)) {
                return {
                    title: "📝 Visible Content",
                    desc: `This is text or a button that the user actually reads and clicks.`,
                    tweak: `Edit the text between the tags <code>>...<</code> to say what you want.`
                };
            }
        }

        // --- JS CONCEPTS ---
        
        // 1. DATA (Variables)
        if (text.match(/(const|let|var)\s+(\w+)/)) {
            const name = text.match(/(const|let|var)\s+(\w+)/)[2];
            return {
                title: "🧠 Memory Storage",
                desc: `You are creating a label named <strong>"${name}"</strong> to remember some data.`,
                tweak: `Anywhere else in this file, you can type <code>${name}</code> to use this saved data.`
            };
        }

        // 2. INTERACTIONS (Event Listeners)
        if (text.includes('addEventListener')) {
            const evt = text.match(/'(\w+)'/)?.[1] || 'event';
            return {
                title: "⚡ Interaction Trigger",
                desc: `The code is now "Listening" for a <strong>${evt}</strong>. It is waiting for the user to do something.`,
                tweak: `The code inside the <code>{ ... }</code> is what happens <em>after</em> the user triggers this.`
            };
        }

        // 3. DOM MANIPULATION (Selectors)
        if (text.includes('querySelector') || text.includes('getElementById')) {
            return {
                title: "🪝 The Hook",
                desc: `JavaScript is reaching into your HTML to grab a specific element so it can control it.`,
                tweak: `Ensure the ID or Class inside the quotes actually exists in your HTML file.`
            };
        }

        // 4. LOGIC (Functions)
        if (text.includes('function') || text.includes('=>')) {
            return {
                title: "⚙️ The Recipe",
                desc: `You are defining a reusable set of instructions.`,
                tweak: `This code doesn't run yet. It only runs when you "call" this function name later.`
            };
        }

        return null; // Skip unknown lines to keep noise down
    };

    // --- 2. THE UI UPDATER ---
    const updateInterface = () => {
        const code = codeInput.value;
        
        // Highlight Syntax
        highlightingContent.innerHTML = code
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        Prism.highlightElement(highlightingContent);

        // Generate Insights
        const lines = code.split('\n');
        explanationOutput.innerHTML = ''; 

        let hasContent = false;

        lines.forEach((line, index) => {
            const insight = analyzeLine(line);
            if (!insight) return; // Skip empty/irrelevant lines
            
            hasContent = true;

            const card = document.createElement('div');
            card.className = 'insight-card';
            card.innerHTML = `
                <div class="card-header">
                    <span class="concept-tag">${insight.title}</span>
                    <span class="line-badge">Line ${index + 1}</span>
                </div>
                <div class="card-body">
                    ${insight.desc}
                    <div class="tweak-section">
                        <span class="tweak-title"><i class="fa-solid fa-screwdriver-wrench"></i> How to Customize</span>
                        ${insight.tweak}
                    </div>
                </div>
            `;
            explanationOutput.appendChild(card);
        });

        if (!hasContent && code.trim().length > 0) {
            explanationOutput.innerHTML = `<div class="empty-state"><p>Keep typing... waiting for a complete thought.</p></div>`;
        } else if (code.trim().length === 0) {
            explanationOutput.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-layer-group"></i>
                    <p>Paste your code on the left.<br>I will tell you how to customize it.</p>
                </div>`;
        }
    };

    // --- 3. SCROLL SYNC & DEBOUNCE ---
    const debounce = (func, wait) => {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };

    // 
    codeInput.addEventListener('scroll', () => {
        const wrapper = codeInput.closest('.editor-wrapper');
        const pre = wrapper.querySelector('pre');
        pre.scrollTop = codeInput.scrollTop;
        pre.scrollLeft = codeInput.scrollLeft;
    });

    codeInput.addEventListener('input', debounce(updateInterface, 400));
});
