// Wait for Monaco to load
require(['vs/editor/editor.main'], function () {
    
    // 1. INITIALIZE MONACO EDITOR
    const editor = monaco.editor.create(document.getElementById('monaco-container'), {
        value: [
            '// Interactive Demo Code',
            'const primaryColor = "#ff0055";',
            'const animationSpeed = 500;',
            '',
            'function startApp() {',
            '   console.log("App Started");',
            '   document.body.style.background = primaryColor;',
            '}'
        ].join('\n'),
        language: 'javascript',
        theme: 'vs-dark',
        minimap: { enabled: false },
        fontSize: 14,
        padding: { top: 20 }
    });

    const output = document.getElementById('explanationOutput');

    // 2. THE AST PARSER (The Brain)
    const analyzeCode = () => {
        const code = editor.getValue();
        output.innerHTML = ''; // Clear previous

        try {
            // STEP A: PARSE WITH BABEL
            // This creates a Tree structure of the code, not just text.
            const ast = Babel.packages.parser.parse(code, {
                sourceType: "module",
                plugins: ["jsx"]
            });

            // STEP B: WALK THE TREE
            // We look at the "body" of the program
            ast.program.body.forEach(node => {
                const insight = processNode(node, code);
                if (insight) renderCard(insight);
            });

        } catch (e) {
            // Babel failed? It's likely a Syntax Error.
            renderError(e.message);
        }
    };

    // 3. NODE PROCESSOR (The Translator)
    // Takes a raw AST node and converts it to Human English
    const processNode = (node, fullCode) => {
        
        // CASE: VARIABLE DECLARATION (const x = 10)
        if (node.type === 'VariableDeclaration') {
            const declaration = node.declarations[0];
            const name = declaration.id.name;
            const init = declaration.init;
            
            // Check what KIND of value it is
            let valueType = "Complex Data";
            let tweakTip = "Be careful changing this.";
            let cleanValue = "value";

            if (init.type === 'StringLiteral') {
                valueType = "Text/Color";
                cleanValue = `"${init.value}"`;
                if (init.value.startsWith('#')) {
                    tweakTip = "Change this hex code to update the color theme.";
                } else {
                    tweakTip = "Change the text inside the quotes.";
                }
            } else if (init.type === 'NumericLiteral') {
                valueType = "Number";
                cleanValue = init.value;
                tweakTip = "Increase/Decrease this number to adjust size, speed, or quantity.";
            }

            return {
                type: 'type-var',
                title: `Variable: ${name}`, // e.g., Variable: primaryColor
                desc: `You are defining a <strong>${valueType}</strong> setting called <strong>${name}</strong>.`,
                value: cleanValue,
                tweak: tweakTip
            };
        }

        // CASE: FUNCTION (function doSomething() {})
        if (node.type === 'FunctionDeclaration') {
            return {
                type: 'type-func',
                title: `Action: ${node.id.name}`,
                desc: `You are creating a reusable action named <strong>${node.id.name}</strong>.`,
                tweak: "The code inside the <code>{ }</code> is the recipe. It won't run until you call this name."
            };
        }

        // CASE: EXPRESSION (document.body.style...)
        if (node.type === 'ExpressionStatement') {
            const expr = node.expression;
            
            // Assignment (x = y)
            if (expr.type === 'AssignmentExpression') {
                return {
                    type: 'type-style',
                    title: "Update Logic",
                    desc: "You are changing a value dynamically.",
                    tweak: "Ensure the variable on the left exists."
                };
            }
            
            // Function Call (console.log, alert)
            if (expr.type === 'CallExpression') {
                const callee = fullCode.substring(expr.callee.start, expr.callee.end);
                
                if (callee.includes('addEventListener')) {
                    return {
                        type: 'type-hook',
                        title: "Interaction Listener",
                        desc: "You are waiting for the user to do something.",
                        tweak: "Check the first word in quotes (e.g., 'click') to change the trigger."
                    };
                }
                
                return {
                    type: 'type-func',
                    title: `Run Command: ${callee}`,
                    desc: "You are executing a specific command immediately.",
                    tweak: "This happens as soon as the line is reached."
                };
            }
        }

        return null;
    };

    // 4. RENDERER
    const renderCard = (data) => {
        const card = document.createElement('div');
        card.className = `node-card ${data.type}`;
        card.innerHTML = `
            <div class="card-title">
                <span>${data.title}</span>
                ${data.value ? `<span class="value-badge">${data.value}</span>` : ''}
            </div>
            <div class="card-desc">${data.desc}</div>
            <div class="tweak-guide">
                <i class="fa-solid fa-wrench"></i> <strong>Customize:</strong> ${data.tweak}
            </div>
        `;
        output.appendChild(card);
    };

    const renderError = (msg) => {
        const card = document.createElement('div');
        card.className = 'node-card';
        card.style.borderLeftColor = '#ff4757';
        card.innerHTML = `
            <div class="card-title" style="color:#ff4757">Syntax Error</div>
            <div class="card-desc">${msg}</div>
        `;
        output.appendChild(card);
    };

    // 5. EVENTS
    // Monaco has its own event system, much better than 'input'
    editor.onDidChangeModelContent(() => {
        analyzeCode();
    });

    // Run once on load
    analyzeCode();
});
