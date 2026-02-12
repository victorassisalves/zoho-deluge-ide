// src/ui/AIAgent.js
import aiService from "../services/AIService.js";
import store from "../core/store.js";

class AIAgent {
    constructor() {
        this.researchPollingInterval = null;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Tab Switching
        document.querySelectorAll(".ai-tab").forEach(tab => {
            tab.addEventListener("click", () => {
                document.querySelectorAll(".ai-tab").forEach(t => t.classList.remove("active"));
                document.querySelectorAll(".agent-view").forEach(v => v.classList.remove("active"));
                tab.classList.add("active");
                const agent = tab.getAttribute("data-agent");
                document.getElementById(`agent-${agent}-view`).classList.add("active");
            });
        });

        const researchBtn = document.getElementById("ai-research-btn");
        if (researchBtn) researchBtn.addEventListener("click", () => this.startDeepResearch());

        const researchGoal = document.getElementById("ai-research-goal");
        if (researchGoal) {
            researchGoal.addEventListener("keydown", (e) => {
                if (e.key === "Enter" && e.ctrlKey) this.startDeepResearch();
            });
        }

        const redoPlanBtn = document.getElementById("ai-redo-plan-btn");
        if (redoPlanBtn) {
            redoPlanBtn.addEventListener("click", () => {
                const resContainer = document.getElementById("research-result-container");
                if (resContainer) resContainer.style.display = "none";
                if (researchGoal) researchGoal.focus();
            });
        }

        const buildThisBtn = document.getElementById("ai-build-this-btn");
        if (buildThisBtn) buildThisBtn.addEventListener("click", () => this.handoffToArchitecture());

        const askBtn = document.getElementById("ai-ask-btn");
        if (askBtn) askBtn.addEventListener("click", () => this.askGemini());

        const explainBtn = document.getElementById("ai-explain-btn");
        if (explainBtn) explainBtn.addEventListener("click", () => this.explainCode());

        const questionInput = document.getElementById("ai-question");
        if (questionInput) {
            questionInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter" && e.ctrlKey) this.askGemini();
            });
        }
    }

    async startDeepResearch() {
        const goalInput = document.getElementById("ai-research-goal");
        const goal = goalInput ? goalInput.value.trim() : "";
        if (!goal) return;

        const progressContainer = document.getElementById("research-progress-container");
        const resultContainer = document.getElementById("research-result-container");
        const progressFill = document.getElementById("research-progress-fill");
        const percentText = document.getElementById("research-percent");
        const statusText = document.getElementById("research-status-text");

        if (progressContainer) progressContainer.style.display = "block";
        if (resultContainer) resultContainer.style.display = "none";
        if (progressFill) progressFill.style.width = "0%";
        if (percentText) percentText.innerText = "0%";
        if (statusText) statusText.innerText = "Initializing...";

        try {
            // Get Code Context via Event/Window (Assuming EditorWrapper exposes it or we dispatch event request)
            // For now, assume window.editor is available or we dispatch a request
            let codeContext = "";
            if (window.editor) {
                codeContext = window.editor.getValue();
            }

            const id = await aiService.startDeepResearch(goal, codeContext);

            if (this.researchPollingInterval) clearInterval(this.researchPollingInterval);

            this.researchPollingInterval = aiService.pollResearch(
                id,
                (percent, status) => this.updateProgress(percent, status),
                (report) => this.showResearchResult(report),
                (error) => {
                    if (statusText) statusText.innerText = "Error: " + error;
                }
            );

        } catch (e) {
            if (statusText) statusText.innerText = "Error: " + e.message;
        }
    }

    updateProgress(percent, status) {
        const progressFill = document.getElementById("research-progress-fill");
        const percentText = document.getElementById("research-percent");
        const statusText = document.getElementById("research-status-text");
        if (progressFill) progressFill.style.width = percent + "%";
        if (percentText) percentText.innerText = Math.round(percent) + "%";
        if (status && statusText) statusText.innerText = status;
    }

    showResearchResult(report) {
        store.state.currentResearchReport = report;
        const resContainer = document.getElementById("research-result-container");
        const reportEdit = document.getElementById("research-report-edit");
        if (resContainer) resContainer.style.display = "flex";
        if (reportEdit) reportEdit.value = report;
    }

    handoffToArchitecture() {
        const reportEdit = document.getElementById("research-report-edit");
        const report = reportEdit ? reportEdit.value : "";
        store.state.currentResearchReport = report;

        const archTab = document.querySelector(".ai-tab[data-agent='architecture']");
        if (archTab) archTab.click();

        const summary = document.getElementById("arch-plan-summary");
        if (summary) {
            summary.innerHTML = `<strong>Active Plan:</strong><br>` + report.substring(0, 300).replace(/\n/g, "<br>") + `...`;
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

    async askGemini(customPrompt = null) {
        const questionInput = document.getElementById("ai-question");
        const question = customPrompt || (questionInput ? questionInput.value : "");
        if (!question.trim()) return;

        const chatHistory = document.getElementById("ai-chat-history");
        const userMsg = document.createElement("div");
        userMsg.className = "chat-msg user";
        userMsg.innerText = customPrompt ? (customPrompt.length > 50 ? "Refining code..." : customPrompt) : question;
        if (chatHistory) {
            chatHistory.appendChild(userMsg);
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }
        if (!customPrompt && questionInput) questionInput.value = "";

        const aiMsg = document.createElement("div");
        aiMsg.className = "chat-msg ai";
        aiMsg.innerText = "Generating code...";
        if (chatHistory) {
            chatHistory.appendChild(aiMsg);
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }

        try {
            let codeContext = "";
            if (window.editor) {
                codeContext = window.editor.getValue();
            }

            const response = await aiService.askGemini(question, codeContext, store.state.currentResearchReport);

            aiMsg.innerHTML = response.replace(/\n/g, "<br>").replace(/```deluge/g, "<pre>").replace(/```/g, "</pre>");

        } catch (e) {
            console.error("askGemini Error:", e);
            aiMsg.innerText = "Error: " + e.message;
        }
        if (chatHistory) chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    async explainCode() {
        if (!window.editor) return;
        const code = window.editor.getValue();
        const prompt = `Please provide a detailed explanation of this Zoho Deluge code.\nInclude:\n1. A quick summary of what the code does.\n2. The main highlights and logic flow.\n3. How it works step-by-step.\n4. Any potential issues or improvements.\n\nCode:\n` + "```deluge\n" + code + "\n```";
        this.askGemini(prompt);
    }
}

export default new AIAgent();
