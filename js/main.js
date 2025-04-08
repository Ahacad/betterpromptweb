/**
 * Better Prompt - Main Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("BetterPrompt Web App loaded.");

    // Get page element references
    const apiKeyInput = document.getElementById('apiKey');
    const showKeyCheckbox = document.getElementById('showKey');
    const apiKeyStatus = document.getElementById('apiKeyStatus');
    const promptSelector = document.getElementById('promptSelector');
    const customPromptSection = document.getElementById('customPromptSection');
    const customPromptTextarea = document.getElementById('customPrompt');
    const templateContent = document.getElementById('templateContent');
    const modelSelector = document.getElementById('modelSelector');
    const temperatureSlider = document.getElementById('temperatureSlider');
    const temperatureValue = document.getElementById('temperatureValue');
    const originalPromptTextarea = document.getElementById('originalPrompt');
    const optimizedPromptTextarea = document.getElementById('optimizedPrompt');
    const optimizeButton = document.getElementById('optimizeButton');
    const copyButton = document.getElementById('copyButton');
    const clearButton = document.getElementById('clearButton');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    // Custom template modal elements
    const customTemplateModal = document.getElementById('customTemplateModal');
    const modalCustomPrompt = document.getElementById('modalCustomPrompt');
    const closeCustomTemplateModal = document.getElementById('closeCustomTemplateModal');
    const saveCustomTemplateBtn = document.getElementById('saveCustomTemplateBtn');
    const cancelCustomTemplateBtn = document.getElementById('cancelCustomTemplateBtn');

    // Create debounced version of the save settings function
    const debouncedSaveSettings = debounce(saveSettings, 800);

    // Load saved settings on page load
    loadSavedSettings();

    // Event listeners
    
    // Toggle show/hide API key
    showKeyCheckbox.addEventListener('change', () => {
        apiKeyInput.type = showKeyCheckbox.checked ? 'text' : 'password';
    });

    // Handle prompt template selection change
    promptSelector.addEventListener('change', () => {
        handlePromptChange();
        saveSettings(); // Save immediately on dropdown change
    });

    // Handle custom prompt textarea changes
    customPromptTextarea.addEventListener('input', () => {
        updateTemplateDisplay();
        debouncedSaveSettings();
    });

    // Handle API key changes
    apiKeyInput.addEventListener('input', () => {
        debouncedSaveSettings();
        checkApiKey();
    });

    // Handle model selection changes
    modelSelector.addEventListener('change', () => {
        saveSettings();
    });

    // Handle temperature slider changes
    temperatureSlider.addEventListener('input', () => {
        temperatureValue.textContent = temperatureSlider.value;
        debouncedSaveSettings();
    });

    // Handle original prompt textarea input
    originalPromptTextarea.addEventListener('input', () => {
        // Enable/disable optimize button based on content
        optimizeButton.disabled = originalPromptTextarea.value.trim() === '';
    });

    // Handle optimize button click
    optimizeButton.addEventListener('click', optimizePrompt);

    // Handle copy button click
    copyButton.addEventListener('click', copyOptimizedText);

    // Handle clear button click
    clearButton.addEventListener('click', clearAll);

    // Handle custom template modal events
    saveCustomTemplateBtn.addEventListener('click', () => {
        customPromptTextarea.value = modalCustomPrompt.value;
        updateTemplateDisplay();
        saveSettings();
        customTemplateModal.style.display = 'none';
    });

    closeCustomTemplateModal.addEventListener('click', () => {
        customTemplateModal.style.display = 'none';
    });

    cancelCustomTemplateBtn.addEventListener('click', () => {
        customTemplateModal.style.display = 'none';
    });

    // Close modal if clicked outside
    window.addEventListener('click', (event) => {
        if (event.target === customTemplateModal) {
            customTemplateModal.style.display = 'none';
        }
    });

    // Enable keyboard shortcuts
    originalPromptTextarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) { // Ctrl+Enter triggers optimization
            e.preventDefault();
            if (!optimizeButton.disabled) {
                optimizePrompt();
            }
        }
    });

    /**
     * Checks the API key status and updates UI accordingly
     */
    function checkApiKey() {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            apiKeyStatus.textContent = 'API key is required to use the optimization feature.';
            apiKeyStatus.style.color = '#d85c4d';
        } else {
            apiKeyStatus.textContent = 'API key is set.';
            apiKeyStatus.style.color = '#328E6E';
        }
    }

    /**
     * Loads saved settings from localStorage
     */
    function loadSavedSettings() {
        console.log("Loading saved settings...");
        
        // Load API key
        const savedApiKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
        if (savedApiKey) {
            apiKeyInput.value = savedApiKey;
            console.log("API key loaded");
        }
        
        // Check API key status
        checkApiKey();
        
        // Load prompt type
        const promptType = localStorage.getItem(STORAGE_KEYS.PROMPT_TYPE) || 'default';
        promptSelector.value = promptType;
        console.log(`Prompt type loaded: ${promptType}`);
        
        // Load custom prompt
        const customPrompt = localStorage.getItem(STORAGE_KEYS.CUSTOM_PROMPT);
        if (customPrompt) {
            customPromptTextarea.value = customPrompt;
            modalCustomPrompt.value = customPrompt;
        }
        
        // Show/hide custom prompt section based on selection
        if (promptType === 'custom') {
            customPromptSection.style.display = 'block';
        }
        
        // Load model selection
        const modelName = localStorage.getItem(STORAGE_KEYS.MODEL) || DEFAULT_MODEL;
        modelSelector.value = modelName;
        console.log(`Model loaded: ${modelName}`);
        
        // Load temperature
        const temperature = localStorage.getItem(STORAGE_KEYS.TEMPERATURE) !== null
            ? localStorage.getItem(STORAGE_KEYS.TEMPERATURE)
            : DEFAULT_TEMPERATURE;
        temperatureSlider.value = temperature;
        temperatureValue.textContent = temperature;
        console.log(`Temperature loaded: ${temperature}`);
        
        // Update template display
        updateTemplateDisplay();
        
        console.log("Settings loaded successfully");
    }

    /**
     * Handles prompt template change
     */
    function handlePromptChange() {
        const selectedValue = promptSelector.value;
        console.log(`Prompt template changed to: ${selectedValue}`);
        
        // Show/hide custom prompt section
        if (selectedValue === 'custom') {
            customPromptSection.style.display = 'block';
            // Also show the custom template modal for editing
            modalCustomPrompt.value = customPromptTextarea.value;
            customTemplateModal.style.display = 'block';
        } else {
            customPromptSection.style.display = 'none';
        }
        
        updateTemplateDisplay();
    }

    /**
     * Updates the template content display
     */
    function updateTemplateDisplay() {
        const selectedValue = promptSelector.value;
        
        if (selectedValue === 'custom') {
            // Use custom prompt
            const customText = customPromptTextarea.value.trim();
            templateContent.textContent = customText || "Enter your custom template...";
        } else if (SYSTEM_PROMPTS[selectedValue]) {
            // Use predefined system prompt
            templateContent.textContent = SYSTEM_PROMPTS[selectedValue];
        } else {
            templateContent.textContent = "Unknown template type";
        }
    }

    /**
     * Saves all settings to localStorage
     */
    function saveSettings() {
        console.log("Saving settings...");
        
        const apiKey = apiKeyInput.value.trim();
        const selectedPromptType = promptSelector.value;
        const customPrompt = customPromptTextarea.value.trim();
        const selectedModel = modelSelector.value;
        const temperature = parseFloat(temperatureSlider.value);
        
        // Save to localStorage
        localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
        localStorage.setItem(STORAGE_KEYS.PROMPT_TYPE, selectedPromptType);
        localStorage.setItem(STORAGE_KEYS.CUSTOM_PROMPT, customPrompt);
        localStorage.setItem(STORAGE_KEYS.MODEL, selectedModel);
        localStorage.setItem(STORAGE_KEYS.TEMPERATURE, isNaN(temperature) ? DEFAULT_TEMPERATURE : temperature);
        
        console.log("Settings saved successfully");
        showToast('Settings saved', 'success');
    }

    /**
     * Optimizes the prompt using Gemini API
     */
    async function optimizePrompt() {
        const originalText = originalPromptTextarea.value.trim();
        
        if (!originalText) {
            showToast("Please enter a prompt to optimize", "warning");
            return;
        }
        
        // Check for API key
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            showToast("Please enter your Gemini API key", "error");
            return;
        }
        
        // Show loading indicator
        loadingIndicator.classList.add('show');
        optimizeButton.disabled = true;
        
        // Get current settings
        const promptType = promptSelector.value;
        const modelName = modelSelector.value;
        const temperature = parseFloat(temperatureSlider.value);
        
        // Determine which system prompt to use
        let systemPrompt = SYSTEM_PROMPTS.default; // Default
        if (promptType === 'custom' && customPromptTextarea.value.trim()) {
            systemPrompt = customPromptTextarea.value.trim();
        } else if (SYSTEM_PROMPTS[promptType]) {
            systemPrompt = SYSTEM_PROMPTS[promptType];
        }
        
        try {
            console.log(`Optimizing prompt using: Template=${promptType}, Model=${modelName}, Temperature=${temperature}`);
            
            // Call Gemini API
            const optimizedText = await callGeminiApi(apiKey, originalText, systemPrompt, modelName, temperature);
            
            // Display the result
            optimizedPromptTextarea.value = optimizedText;
            copyButton.disabled = false;
            showToast("Optimization complete", "success");
            
        } catch (error) {
            console.error("Optimization error:", error);
            showToast(`Optimization failed: ${error.message}`, "error");
        } finally {
            // Hide loading indicator
            loadingIndicator.classList.remove('show');
            optimizeButton.disabled = false;
        }
    }

    /**
     * Copies optimized text to clipboard
     */
    function copyOptimizedText() {
        const textToCopy = optimizedPromptTextarea.value;
        
        if (!textToCopy) {
            showToast("No text to copy", "warning");
            return;
        }
        
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                console.log("Text copied to clipboard");
                showToast("Copied to clipboard", "success");
            })
            .catch(err => {
                console.error("Copy failed:", err);
                showToast("Copy failed, please select and copy manually", "error");
            });
    }

    /**
     * Clears all input and output
     */
    function clearAll() {
        originalPromptTextarea.value = '';
        optimizedPromptTextarea.value = '';
        copyButton.disabled = true;
        optimizeButton.disabled = true;
        console.log("All text cleared");
    }
});