import re

with open('ide.js', 'r') as f:
    content = f.read()

# 1. Extract everything before the first AI logic
parts = content.split('// AI Agents Logic')
header = parts[0]

# 2. Extract the AI logic (the good one)
# I'll use the one I just fixed
ai_logic = """
    let currentResearchReport = "";
    let researchPollingInterval = null;

    // Tab Switching
    document.querySelectorAll('.ai-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.ai-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.agent-view').forEach(v => v.classList.remove('active'));
            tab.classList.add('active');
            const agent = tab.getAttribute('data-agent');
            document.getElementById(`agent-${agent}-view`).classList.add('active');
        });
    });

    bind('ai-research-btn', 'click', startDeepResearch);
    bind('ai-research-goal', 'keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) startDeepResearch();
    });
    bind('ai-redo-plan-btn', 'click', () => {
        document.getElementById('research-result-container').style.display = 'none';
        document.getElementById('ai-research-goal').focus();
    });
    bind('ai-build-this-btn', 'click', handoffToArchitecture);

    async function startDeepResearch() {
        const goalInput = document.getElementById('ai-research-goal');
        const goal = goalInput.value.trim();
        if (!goal) return;

        const progressContainer = document.getElementById('research-progress-container');
        const resultContainer = document.getElementById('research-result-container');
        const progressFill = document.getElementById('research-progress-fill');
        const percentText = document.getElementById('research-percent');
        const statusText = document.getElementById('research-status-text');

        if (progressContainer) progressContainer.style.display = 'block';
        if (resultContainer) resultContainer.style.display = 'none';
        if (progressFill) progressFill.style.width = '0%';
        if (percentText) percentText.innerText = '0%';
        if (statusText) statusText.innerText = 'Initializing...';

        const result = await chrome.storage.local.get(["gemini_api_key"]);
        if (!result.gemini_api_key) {
            if (statusText) statusText.innerText = "Error: Set API Key in Settings.";
            return;
        }

        try {
            const codeContext = editor.getValue();
            const prompt = `Task for Deep Research: ${goal}\\n\\nCurrent Code Context:\\n\`\`\`deluge\\n${codeContext}\\n\`\`\`\\n\\nPlease research the best approach to solve this task, considering Zoho environment limitations and best practices. Provide a detailed architecture and scope.`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/interactions?key=${result.gemini_api_key}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    input: prompt,
                    agent: "deep-research-pro-preview-12-2025",
                    background: true
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            const interactionId = data.id;
            pollResearch(interactionId, result.gemini_api_key);

        } catch (e) {
            if (statusText) statusText.innerText = "Error: " + e.message;
        }
    }

    function pollResearch(id, apiKey) {
        let progress = 5;
        updateProgress(progress, "Planning research steps...");

        if (researchPollingInterval) clearInterval(researchPollingInterval);

        researchPollingInterval = setInterval(async () => {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/interactions/${id}?key=${apiKey}`);
                const data = await response.json();

                if (progress < 90) {
                    progress += Math.random() * 3;
                    updateProgress(progress, "Searching and analyzing documentation...");
                }

                if (data.status === 'completed') {
                    clearInterval(researchPollingInterval);
                    updateProgress(100, "Research Complete");
                    const report = data.outputs?.[data.outputs.length - 1]?.text || "No output generated.";
                    showResearchResult(report);
                } else if (data.status === 'failed') {
                    clearInterval(researchPollingInterval);
                    const statusText = document.getElementById('research-status-text');
                    if (statusText) statusText.innerText = "Error: Research failed.";
                }
            } catch (e) {
                clearInterval(researchPollingInterval);
                const statusText = document.getElementById('research-status-text');
                if (statusText) statusText.innerText = "Polling Error: " + e.message;
            }
        }, 5000);
    }

    function updateProgress(percent, status) {
        const progressFill = document.getElementById('research-progress-fill');
        const percentText = document.getElementById('research-percent');
        const statusText = document.getElementById('research-status-text');
        if (progressFill) progressFill.style.width = percent + '%';
        if (percentText) percentText.innerText = Math.round(percent) + '%';
        if (status && statusText) statusText.innerText = status;
    }

    function showResearchResult(report) {
        currentResearchReport = report;
        const resultContainer = document.getElementById('research-result-container');
        const reportEdit = document.getElementById('research-report-edit');
        if (resultContainer) resultContainer.style.display = 'flex';
        if (reportEdit) reportEdit.value = report;
    }

    function handoffToArchitecture() {
        const report = document.getElementById('research-report-edit').value;
        currentResearchReport = report;

        const archTab = document.querySelector('.ai-tab[data-agent="architecture"]');
        if (archTab) archTab.click();

        const summary = document.getElementById('arch-plan-summary');
        if (summary) {
            summary.innerHTML = `<strong>Active Plan:</strong><br>${report.substring(0, 300).replace(/\\n/g, '<br>')}...`;
        }

        const chatHistory = document.getElementById("ai-chat-history");
        if (chatHistory) {
            const aiMsg = document.createElement("div");
            aiMsg.className = "chat-msg ai";
            aiMsg.innerText = "Plan received. I am ready to build the solution in Deluge/Client Script following best practices. How can I help you implement this plan?";
            chatHistory.appendChild(aiMsg);
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }
    }
"""

# 3. Define the askGemini function (correctly)
ask_gemini = """
async function askGemini(customPrompt = null) {
    const questionInput = document.getElementById("ai-question");
    const question = customPrompt || questionInput.value;
    if (!question.trim()) return;

    const chatHistory = document.getElementById("ai-chat-history");
    const userMsg = document.createElement("div");
    userMsg.className = "chat-msg user";
    userMsg.innerText = customPrompt ? (customPrompt.length > 50 ? "Refining code..." : customPrompt) : question;
    if (chatHistory) {
        chatHistory.appendChild(userMsg);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
    if (!customPrompt) questionInput.value = "";

    const aiMsg = document.createElement("div");
    aiMsg.className = "chat-msg ai";
    aiMsg.innerText = "Generating code...";
    if (chatHistory) {
        chatHistory.appendChild(aiMsg);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    if (typeof chrome !== "undefined" && chrome.storage) {
        const result = await chrome.storage.local.get(["gemini_api_key", "gemini_model"]);
        if (!result.gemini_api_key) {
            aiMsg.innerText = "Error: Please set your Gemini API Key in Settings.";
            return;
        }
        const model = document.getElementById("ai-model-selector")?.value || result.gemini_model || "gemini-3-flash-preview";
        try {
            const codeContext = editor.getValue();
            let prompt = `You are a Zoho expert specializing in Deluge and Client Scripts.
Focus on best practices and clean naming conventions.

Current Code Context:
\\\\\\`\\\\\\`\\\\\\`deluge
${codeContext}
\\\\\\`\\\\\\`\\\\\\`

`;

            if (currentResearchReport) {
                prompt += `Architectural Plan to follow:
---
${currentResearchReport}
---

`;
            }

            prompt += `User Question/Task: ${question}`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${result.gemini_api_key}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            const data = await response.json();
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Error: " + (data.error?.message || "Unknown");
            aiMsg.innerHTML = textResponse.replace(/\\n/g, "<br>").replace(/\\\\\\`\\\\\\`\\\\\\`deluge/g, "<pre>").replace(/\\\\\\`\\\\\\`\\\\\\`/g, "</pre>");
        } catch (e) {
            console.error("[ZohoIDE] askGemini Error:", e);
            aiMsg.innerText = "Error: " + e.message;
        }
    } else {
        aiMsg.innerText = "Error: Extension context unavailable.";
    }
    if (chatHistory) chatHistory.scrollTop = chatHistory.scrollHeight;
}
"""

# 4. Find where the IIFE ends (the footer/status bar/resizer logic)
footer_logic_match = re.search(r'function explainCode.*', content, re.DOTALL)
footer_logic = footer_logic_match.group(0)

# 5. Reconstruct
new_content = header + "// AI Agents Logic" + ai_logic + "\\n" + ask_gemini + "\\n" + footer_logic

with open('ide.js', 'w') as f:
    f.write(new_content)
