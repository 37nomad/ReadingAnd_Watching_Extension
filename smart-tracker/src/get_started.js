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

  console.log("🧠 Running LLM summarization...");

  const reply = await engine.chat.completions.create({
    messages: [
      {
        role: "system", // Change 2 ---> system role ke liye content change kardiya for better classification.
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
    max_tokens: 4096, // Change 1 ---> isko 4096 kardiya from 1024 

  });

  console.log("📝 Summary:", reply.choices[0].message.content);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "summarize" && message.data) {
    const { title, description } = message.data;
    //------------------>

    // Change 3 ---> yaha pe apan description ko limit kar rahe hain to first 1000 words kyuki max_tokens = 4096 hee hai so extracting 
    // first 1000 words is a good choice or we can go upto 2000 words but this is the maximum.
    const limitedDescription = description.split(/\s+/).slice(0, 1000).join(" ");
    
    //------------------>
    console.log("📥 Received data to summarize:", title, limitedDescription);
    runSummarization(title, limitedDescription);
    sendResponse({ status: "summarizing" });
  }
});

main();