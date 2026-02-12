// src/services/AIService.js
import store from "../core/store.js";

class AIService {
    async getApiKey() {
        if (typeof chrome !== "undefined" && chrome.storage) {
            const result = await chrome.storage.local.get(["gemini_api_key"]);
            return result.gemini_api_key;
        }
        return null;
    }

    async getModel() {
        if (typeof chrome !== "undefined" && chrome.storage) {
            const result = await chrome.storage.local.get(["gemini_model"]);
            return result.gemini_model || "gemini-3-flash-preview";
        }
        return "gemini-3-flash-preview";
    }

    async startDeepResearch(goal, codeContext) {
        const apiKey = await this.getApiKey();
        if (!apiKey) throw new Error("API Key not set.");

        const prompt = `Task for Deep Research: ${goal}\n\nCurrent Code Context:\n` + "```deluge\n" + codeContext + "\n```\n" + `Please research the best approach to solve this task, considering Zoho environment limitations and best practices. Provide a detailed architecture and scope.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/interactions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey
            },
            body: JSON.stringify({
                input: prompt,
                agent: "deep-research-pro-preview-12-2025",
                background: true
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        return data.id;
    }

    pollResearch(id, onProgress, onComplete, onError) {
        let progress = 5;
        onProgress(progress, "Planning research steps...");

        // We need to resolve apiKey inside the interval or before
        // Since getApiKey is async, let do it once inside

        let interval = setInterval(async () => {
            try {
                const apiKey = await this.getApiKey();
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/interactions/${id}`, {
                    headers: { "x-goog-api-key": apiKey }
                });
                const data = await response.json();

                if (progress < 90) {
                    progress += Math.random() * 3;
                    onProgress(progress, "Searching and analyzing documentation...");
                }

                if (data.status === "completed") {
                    clearInterval(interval);
                    onProgress(100, "Research Complete");
                    const report = data.outputs?.[data.outputs.length - 1]?.text || "No output generated.";
                    onComplete(report);
                } else if (data.status === "failed") {
                    clearInterval(interval);
                    onError("Research failed.");
                }
            } catch (e) {
                clearInterval(interval);
                onError(e.message);
            }
        }, 5000);

        return interval;
    }

    async askGemini(question, codeContext, researchReport) {
        const apiKey = await this.getApiKey();
        if (!apiKey) throw new Error("API Key not set.");

        const model = await this.getModel();

        let prompt = `You are a Zoho expert specializing in Deluge and Client Scripts.
Focus on best practices and clean naming conventions.

Current Code Context:
` + "```deluge\n" + codeContext + "\n```\n\n";

        if (researchReport) {
            prompt += `Architectural Plan to follow:
---
${researchReport}
---

`;
        }

        prompt += `User Question/Task: ${question}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        return data.candidates?.[0]?.content?.parts?.[0]?.text || "Error: " + (data.error?.message || "Unknown");
    }

    async explainCode(codeContext) {
        const prompt = `Please provide a detailed explanation of this Zoho Deluge code.\nInclude:\n1. A quick summary of what the code does.\n2. The main highlights and logic flow.\n3. How it works step-by-step.\n4. Any potential issues or improvements.\n\nCode:\n` + "```deluge\n" + codeContext + "\n```";
        // Passing prompt as question, empty codeContext since it is embedded
        return await this.askGemini(prompt, "", null);
    }
}

const aiService = new AIService();
export default aiService;
