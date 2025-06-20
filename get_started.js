import * as webllm from "@mlc-ai/web-llm";
function setLabel(id, text) {
  const label = document.getElementById(id);
  if (label == null) {
    throw Error("Cannot find label " + id);
  }
  label.innerText = text;
}
async function main() {
  const initProgressCallback = (report) => {
    setLabel("init-label", report.text);
  };
  // Option 1: If we do not specify appConfig, we use `prebuiltAppConfig` defined in `config.ts`
  // console.time("Model Loading Time: ");
  const selectedModel = "Llama-3.2-1B-Instruct-q4f16_1-MLC";
  // const engine: webllm.MLCEngineInterface = await webllm.CreateMLCEngine(
  //   selectedModel,
  //   {
  //     initProgressCallback: initProgressCallback,
  //     logLevel: "INFO", // specify the log level
  //   },
  //   // customize kv cache, use either context_window_size or sliding_window_size (with attention sink)
  //   {
  //     context_window_size: 8192,
  //     // force_full_download: true, // force full download of the model, useful for debugging
  //     // sliding_window_size: 1024,
  //     // attention_sink_size: 4,
  //   }
  // );
  // console.timeEnd("Model Loading Time: ");
  // Option 2: Specify your own model other than the prebuilt ones
  const appConfig = {
    model_list: [
      {
        model:
          "https://huggingface.co/mlc-ai/Llama-3.2-1B-Instruct-q4f16_1-MLC",
        model_id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
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
  console.time("Model Loading Time: ");
  const engine = await webllm.CreateMLCEngine(selectedModel, {
    appConfig: appConfig,
    initProgressCallback: initProgressCallback,
  });
  console.timeEnd("Model Loading Time: ");
  // Option 3: Instantiate MLCEngine() and call reload() separately
  // const engine: webllm.MLCEngineInterface = new webllm.MLCEngine({
  //   appConfig: appConfig, // if do not specify, we use webllm.prebuiltAppConfig
  //   initProgressCallback: initProgressCallback,
  // });
  // await engine.reload(selectedModel);
  // console.log("Started generating the answer...");
  // [
  //   {
  //     role: "system",
  //     content: "Only generate a 3-line summary if the content is useful, educational, or appropriate. Otherwise, respond with 'Not suitable for summary.'"
  //   },
  //   {
  //     role: "user",
  //     content: `Title: "${title}"\nDescription: "${description}"`
  //   }
  // ]
  // let title = "Untitled";
  // let description = "No description found.";
  // // Fetch from chrome.storage.local
  // await new Promise((resolve) => {
  //     chrome.storage.local.get(['scrapedContent'], (result) => {
  //         const scraped = result.scrapedContent;
  //         if (scraped) {
  //             title = scraped.title || "Untitled";
  //             description = scraped.text || scraped.content || "No description.";
  //         }
  //         resolve();
  //     });
  // });
  // console.log(title);
  // console.log(description);
  const title = "Basics of Climate Change"; //"Get Rich Quick!";
  // //
  const description =
    // "Tired of your 9 to 5 job? Learn how you can start making ₹10,000 a day from home with zero investment! Our proven system requires no skills, experience, or effort. Thousands of people have already quit their jobs and are now living their dream life. All you have to do is sign up, refer a few friends, and watch your income grow automatically. No products, no calls, just pure profits. Join now before registration closes!";
    "This article provides a comprehensive introduction to the science of climate change. It begins by explaining the greenhouse effect—how certain gases in the Earth's atmosphere trap heat, warming the planet. It then explores the historical data showing a steady rise in global temperatures over the past century, correlating with increased carbon dioxide levels from industrial activity. The article includes case studies from various parts of the world, showing how melting glaciers, rising sea levels, and extreme weather events are linked to climate shifts. It concludes with a discussion on mitigation strategies, such as reducing fossil fuel consumption, investing in renewable energy, and international cooperation through agreements like the Paris Accord.";
  console.time("Model Response Time: ");
  const reply0 = await engine.chat.completions.create({
    messages: [
      // {
      //   role: "user",
      //   content: `Decide if the following Title and Description are educational or informative.
      //             If YES, respond ONLY with a 2-line summary.
      //             If NO (e.g. clickbait, scam, or promotional content), respond ONLY with: Not suitable.
      //             You must choose ONE. Do not do both. Do not explain.
      //             Title: "${title}"
      //             Description: "${description}"`
      // },
      {
        role: "system",
        content: `You are a content‑screening and summarization assistant.  
                  When given a Title and Description of an article or video:
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
    // stream: true,
    // below configurations are all optional
    // n: 1,
    // temperature: 1.5,
    max_tokens: 4096,
    // 46510 and 7188 are "California", and 8421 and 51325 are "Texas" in Llama-3.1-8B-Instruct
    // So we would have a higher chance of seeing the latter two, but never the first in the answer
    // logprobs: true,
    // top_logprobs: 2,
  });
  // console.log("done with the completion.");
  console.log(reply0.choices[0].message.content);
  console.timeEnd("Model Response Time: ");
  // console.log(reply0.usage);
  // To change model, either create a new engine via `CreateMLCEngine()`, or call `engine.reload(modelId)`
}
main();
