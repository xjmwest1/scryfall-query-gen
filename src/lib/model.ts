/**
 * WebLLM prebuilt model — ~200 MB download, cached after first visit.
 * Uses q4f32 (not q4f16) so it works without the shader-f16 WebGPU extension.
 * On GPUs with shader-f16 support, `SmolLM2-360M-Instruct-q4f16_1-MLC` may be faster.
 */
export const MODEL_ID = "SmolLM2-360M-Instruct-q4f32_1-MLC";

export const MODEL_DOWNLOAD_LABEL = "~200 MB";
