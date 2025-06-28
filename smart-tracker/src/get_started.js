import * as webllm from "@mlc-ai/web-llm";

let engine = null;

async function main() {
    const initProgressCallback = (report) => {
        console.log(`[Model Init]: ${report.text}`);
    };

    const selectedModel = "Llama-3.2-1B-Instruct-q4f16_1-MLC";

    const appConfig = {
        model_list: [
            {
                model: "https://huggingface.co/mlc-ai/Llama-3.2-1B-Instruct-q4f16_1-MLC",
                model_id: selectedModel,
                model_lib:
                    webllm.modelLibURLPrefix +
                    webllm.modelVersion +
                    "/Llama-3.2-1B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
                vram_required_MB: 879.04,
                low_resource_required: true,
                overrides: {
                    context_window_size: 4096,
                },
            },
        ],
    };

    console.time("Model Loading Time:");
    engine = await webllm.CreateMLCEngine(selectedModel, {
        appConfig,
        initProgressCallback,
    });
    console.timeEnd("Model Loading Time:");
}

async function runSummarization(title, description) {
    if (!engine) {
        console.warn("Engine not initialized yet.");
        return;
    }

    console.log("Running LLM summarization...");

    const reply = await engine.chat.completions.create({
        messages: [
            {
                role: "system",
                content: `You are a content‑screening and summarization assistant.  
                  When given a Title and Description of an article or video:Add commentMore actions
                  1. First determine whether the content is genuinely educational, informative, or of general interest.  
                    • If it’s promotional/advertising, scammy, irrelevant, or purely commercial, DO NOT summarize—just reply:  
                      “Content not suitable for summary.”  
                    • Otherwise, proceed to step 2.  
                  2. Generate a concise, three‑line summary that captures the key points of the Title and Description.  
                    • Use plain language suitable for anyone’s browsing overview.`,
            },
            {
                role: "user",
                content: `Title: "${title}"\nDescription: "${description}"`,
            },
        ],
        max_tokens: 4096,

    });

    console.log("Summary:", reply.choices[0].message.content);
    return reply.choices[0].message.content;
}

async function postDataToBackend(title, url, summary) {
    try {
        // 1. Get the authentication token from storage
        const storage = await chrome.storage.local.get("token");
        const token = storage.token;

        if (!token) {
            console.error("Authentication Error: No token found. Please log in.");
            return { success: false, error: "Not logged in" };
        }

        // 2. Make the POST request to your backend
        const response = await fetch("http://localhost:5000/api/data", {
            method: "POST",
            headers: {
                // Set headers for JSON content and authentication
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
                title: title,
                url: url,
                summary: summary,
            }),
        });

        // 3. Handle the response from the server
        const responseData = await response.json();

        if (!response.ok) {
            // The server responded with an error (e.g., 400, 403, 500)
            console.error("API Error:", responseData.error || response.statusText);
            return { success: false, error: responseData.error };
        }

        console.log("Successfully posted data:", responseData);
        return { success: true, data: responseData };

    } catch (error) {
        console.error("Failed to post data due to a network or code error:", error);
        return { success: false, error: error.message };
    }
}

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     if (message.action === "summarize" && message.data) {
//         const { title, description, url } = message.data;

//         const limitedDescription = description.split(/\s+/).slice(0, 1000).join(" ");
//         let summary = null;
//         console.log("Received data to summarize:", title, url, limitedDescription);
//         (async () => {
//             summary = await runSummarization(title, limitedDescription);
//         }
//         )();
//         console.log(title)
//         console.log(url)
//         console.log(summary)
//         sendResponse({ status: "summarizing" });
//     }
// });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "summarize" && message.data) {
        const { title, description, url } = message.data;

        // Limit the description to prevent overly long inputs
        const limitedDescription = description.split(/\s+/).slice(0, 1000).join(" ");
        console.log("Received data to summarize:", title, url);

        // Use an async IIFE (Immediately Invoked Function Expression) to handle the flow
        (async () => {
            // Step 1: Get the summary from the local LLM
            const summary = await runSummarization(title, limitedDescription);
            // Step 2: Check if the summary is valid before posting
            if (!summary || summary.includes("Content not suitable for summary")) {
                console.log("Content not suitable. Aborting post to backend.");
                sendResponse({ status: "not_summarized", message: "Content not suitable for summary." });
                return; // Stop execution
            }

            // Step 3: Post the title, url, and the generated summary to your backend
            console.log("Posting the following data to backend:");
            console.log("Title:", title);
            console.log("URL:", url);
            console.log("Summary:", summary);
            
            const postResult = await postDataToBackend(title, url, summary);

            // Step 4: Respond to the sender
            if (postResult.success) {
                sendResponse({ status: "posted_successfully", data: postResult.data });
            } else {
                sendResponse({ status: "post_failed", error: postResult.error });
            }
        })();

        // Return true to indicate that you will be sending a response asynchronously.
        // This is crucial for Chrome extension message listeners.
        return true;
    }
});

main();