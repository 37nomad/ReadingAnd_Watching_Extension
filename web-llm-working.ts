import { WebLLM } from 'webllm-wasm';

const model = new WebLLM({
  modelPath: chrome.runtime.getURL("models/gemma-3-1b-q4_0.bin"),
  wasmPath: chrome.runtime.getURL("webllm-runtime.wasm"),
  backend: 'webgpu',
  numThreads: 4,
});

export async function summarizeText(prompt) {
  if (!model.isLoaded) {
    await model.load();
    console.log("Model loaded");
  }

  const result = await model.infer(prompt, {
    maxTokens: 64,
    temperature: 0.7
  });

  return result.text.trim();
}
