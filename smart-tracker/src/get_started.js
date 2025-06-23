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
        role: "system",
        content: `You are a content summarizer. Summarize only educational content.`,
      },
      {
        role: "user",
        content: `Title: "${title}"\nDescription: "${description}"`,
      },
    ],
    max_tokens: 1024,
  });

  console.log("📝 Summary:", reply.choices[0].message.content);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "summarize" && message.data) {
    const { title, description } = message.data;
    console.log("📥 Received data to summarize:", title, description);
    runSummarization(title, description);
    sendResponse({ status: "summarizing" });
  }
});

main();
