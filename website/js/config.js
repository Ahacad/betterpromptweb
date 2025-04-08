/**
 * Better Prompt - Configuration Constants
 */

// System templates for optimizing prompts
const SYSTEM_PROMPTS = {
    default: "Analyze the following user input and optimize it into a high-quality AI prompt. Make it clear, logical, with sufficient context and necessary examples to precisely guide the AI in completing the task. Return only the optimized prompt without any explanations or prefixes.",
    concise: "Refine the following user input into a minimal and precise AI prompt. Keep core intent and key information, remove all redundancies, so the AI can quickly grasp the point. Return only the optimized text without any explanations.",
    detailed: "Analyze the following user input in depth and expand it into a complete, detailed, high-quality AI prompt. Clearly describe task objectives, background information, constraints, and examples (where applicable) to ensure the AI can fully understand and accurately respond. Return only the optimized prompt without any explanatory text or additional notes."
};

// Default settings
const DEFAULT_MODEL = "gemini-2.5-pro-exp-03-25";
const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_MAX_OUTPUT_TOKENS = 2048;

// Local storage keys
const STORAGE_KEYS = {
    API_KEY: "betterprompt_geminiApiKey",
    PROMPT_TYPE: "betterprompt_selectedPromptType",
    CUSTOM_PROMPT: "betterprompt_customPrompt",
    MODEL: "betterprompt_selectedModel",
    TEMPERATURE: "betterprompt_temperature"
};