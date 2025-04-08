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
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkModeIcon = document.getElementById('darkModeIcon');
    const editCustomTemplateBtn = document.getElementById('editCustomTemplateBtn');
    const editCustomTemplateContainer = document.getElementById('editCustomTemplateContainer');
    
    // Collapsible elements
    const settingsHeader = document.querySelector('.collapsible-header');
    const settingsContent = document.querySelector('.collapsible-content');
    const settingsIcon = document.querySelector('.collapsible-icon');

    // Custom template modal elements
    const customTemplateModal = document.getElementById('customTemplateModal');
    const modalCustomPrompt = document.getElementById('modalCustomPrompt');
    const closeCustomTemplateModal = document.getElementById('closeCustomTemplateModal');
    const saveCustomTemplateBtn = document.getElementById('saveCustomTemplateBtn');
    const cancelCustomTemplateBtn = document.getElementById('cancelCustomTemplateBtn');

    // Create debounced version of the save settings function
    const debouncedSaveSettings = debounce(saveSettings, 800);

    // Initialize the app
    initializeApp();

    /**
     * Initialize the application
     */
    function initializeApp() {
        // Load saved settings
        loadSavedSettings();
        
        // Add event listeners
        setupEventListeners();
        
        // Initialize drag and drop
        setupDragAndDrop();
        
        // Initialize collapsible sections
        initializeCollapsible();
        
        // Initialize dark mode
        initializeDarkMode();
        
        console.log("App initialization complete");
    }

    /**
     * Setup all event listeners
     */
    function setupEventListeners() {
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

        // Handle edit custom template button
        editCustomTemplateBtn.addEventListener('click', () => {
            // Fill modal with current custom template value
            modalCustomPrompt.value = customPromptTextarea.value || '';
            
            // Show the modal
            customTemplateModal.style.display = 'block';
            setTimeout(() => customTemplateModal.classList.add('show'), 10);
            modalCustomPrompt.focus();
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
        temperatureSlider.addEventListener('input', function() {
            const value = this.value;
            temperatureValue.textContent = value;
            // Add visual feedback
            const percent = (value - this.min) / (this.max - this.min) * 100;
            this.style.background = `linear-gradient(to right, var(--primary-color) 0%, var(--primary-color) ${percent}%, #e2e8f0 ${percent}%, #e2e8f0 100%)`;
            debouncedSaveSettings();
        });
        
        // Initialize temperature slider background
        const initValue = temperatureSlider.value;
        const initPercent = (initValue - temperatureSlider.min) / (temperatureSlider.max - temperatureSlider.min) * 100;
        temperatureSlider.style.background = `linear-gradient(to right, var(--primary-color) 0%, var(--primary-color) ${initPercent}%, #e2e8f0 ${initPercent}%, #e2e8f0 100%)`;

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

        // Handle dark mode toggle
        darkModeToggle.addEventListener('click', toggleDarkMode);

        // Handle collapsible settings panel
        settingsHeader.addEventListener('click', () => {
            toggleCollapsible(settingsHeader, settingsContent, settingsIcon);
        });

        // Handle custom template modal events
        saveCustomTemplateBtn.addEventListener('click', () => {
            // Copy the value from the modal textarea to the hidden textarea
            customPromptTextarea.value = modalCustomPrompt.value;
            
            // Update the template display
            updateTemplateDisplay();
            
            // Save the settings
            saveSettings();
            
            // Show success message
            showToast('Custom template saved', 'success');
            
            // Close the modal
            closeModal();
        });

        closeCustomTemplateModal.addEventListener('click', closeModal);
        cancelCustomTemplateBtn.addEventListener('click', closeModal);

        // Close modal if clicked outside
        window.addEventListener('click', (event) => {
            if (event.target === customTemplateModal) {
                closeModal();
            }
        });

        // Enable keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Escape key to close modal
            if (e.key === 'Escape' && customTemplateModal.style.display === 'block') {
                closeModal();
            }
            
            // Ctrl+Enter to optimize
            if (e.key === 'Enter' && e.ctrlKey) {
                if (document.activeElement === originalPromptTextarea && !optimizeButton.disabled) {
                    e.preventDefault();
                    optimizePrompt();
                }
            }
            
            // Ctrl+D to toggle dark mode
            if (e.key === 'd' && e.ctrlKey) {
                e.preventDefault();
                toggleDarkMode();
            }
        });
    }

    /**
     * Close the custom template modal
     */
    function closeModal() {
        customTemplateModal.classList.remove('show');
        setTimeout(() => {
            customTemplateModal.style.display = 'none';
        }, 300);
    }

    /**
     * Initialize drag and drop for the prompt textarea
     */
    function setupDragAndDrop() {
        // Prevent default to allow drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            originalPromptTextarea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });
        
        // Add highlighting when dragging over
        ['dragenter', 'dragover'].forEach(eventName => {
            originalPromptTextarea.addEventListener(eventName, (e) => {
                if (isTextFileDrag(e)) {
                    originalPromptTextarea.classList.add('highlight');
                }
            }, false);
        });
        
        // Remove highlighting when leaving
        ['dragleave', 'drop'].forEach(eventName => {
            originalPromptTextarea.addEventListener(eventName, () => {
                originalPromptTextarea.classList.remove('highlight');
            }, false);
        });
        
        // Handle drop
        originalPromptTextarea.addEventListener('drop', (e) => {
            const file = e.dataTransfer.files[0];
            if (file && (file.type === 'text/plain' || file.type === '')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    originalPromptTextarea.value = event.target.result;
                    optimizeButton.disabled = originalPromptTextarea.value.trim() === '';
                };
                reader.readAsText(file);
                showToast(`File "${file.name}" loaded`, 'success');
            }
        }, false);
    }

    /**
     * Initialize collapsible sections
     */
    function initializeCollapsible() {
        // Check if there's a saved state for the settings panel
        const isCollapsed = localStorage.getItem('settingsPanelCollapsed') === 'true';
        
        if (isCollapsed) {
            settingsContent.classList.add('collapsed');
            settingsIcon.classList.add('collapsed');
        }
    }

    /**
     * Initialize dark mode
     */
    function initializeDarkMode() {
        // Check if user prefers dark mode or has saved a preference
        const savedDarkMode = localStorage.getItem('darkMode');
        const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Apply dark mode if saved preference exists or system prefers it
        if (savedDarkMode === 'true' || (savedDarkMode === null && prefersDarkMode)) {
            document.body.classList.add('dark-mode');
            darkModeIcon.textContent = 'light_mode';
        }
    }

    /**
     * Toggle dark mode
     */
    function toggleDarkMode() {
        const isDarkMode = document.body.classList.toggle('dark-mode');
        darkModeIcon.textContent = isDarkMode ? 'light_mode' : 'dark_mode';
        localStorage.setItem('darkMode', isDarkMode);
    }

    /**
     * Checks the API key status and updates UI accordingly
     */
    function checkApiKey() {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            apiKeyStatus.textContent = 'API key is required to use the enhancement feature.';
            apiKeyStatus.style.color = '#e53e3e';
        } else {
            apiKeyStatus.innerHTML = '<span class="material-icons" style="font-size: 14px; vertical-align: middle;">check_circle</span> API key is set.';
            apiKeyStatus.style.color = '#48bb78';
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
            editCustomTemplateContainer.style.display = 'block';
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
            editCustomTemplateContainer.style.display = 'block';
            // Don't automatically open the modal, wait for button click
        } else {
            editCustomTemplateContainer.style.display = 'none';
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
            const customText = customPromptTextarea.value || localStorage.getItem(STORAGE_KEYS.CUSTOM_PROMPT) || '';
            templateContent.textContent = customText || "Enter a custom template by clicking 'Edit Custom Template'...";
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
        // We don't need to show a toast for auto-saving settings
        // showToast('Settings saved', 'success');
    }

    /**
     * Optimizes the prompt using Gemini API
     */
    async function optimizePrompt() {
        const originalText = originalPromptTextarea.value.trim();
        
        if (!originalText) {
            showToast("Please enter a prompt to enhance", "warning");
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
            console.log(`Enhancing prompt using: Template=${promptType}, Model=${modelName}, Temperature=${temperature}`);
            
            // Call Gemini API
            const optimizedText = await callGeminiApi(apiKey, originalText, systemPrompt, modelName, temperature);
            
            // Display the result
            optimizedPromptTextarea.value = optimizedText;
            copyButton.disabled = false;
            showToast("Prompt enhanced successfully", "success");
            
        } catch (error) {
            console.error("Enhancement error:", error);
            showToast(`Enhancement failed: ${error.message}`, "error");
        } finally {
            // Hide loading indicator
            loadingIndicator.classList.remove('show');
            optimizeButton.disabled = false;
        }
    }

    /**
     * Copies optimized text to clipboard
     */
    async function copyOptimizedText() {
        const textToCopy = optimizedPromptTextarea.value;
        
        if (!textToCopy) {
            showToast("No text to copy", "warning");
            return;
        }
        
        const success = await copyToClipboard(textToCopy);
        if (success) {
            console.log("Text copied to clipboard");
            showToast("✅ Copied to clipboard", "success");
        } else {
            console.error("Copy failed");
            showToast("Copy failed, please select and copy manually", "error");
        }
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
        showToast("All fields reset", "info");
    }
});