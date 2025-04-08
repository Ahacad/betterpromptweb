/**
 * Better Prompt - Utility Functions
 */

/**
 * Debounce function to limit the rate at which a function can fire
 * @param {Function} func - The function to debounce
 * @param {number} wait - The delay in milliseconds
 * @returns {Function} - The debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Shows a toast notification
 * @param {string} message - The message to display
 * @param {'info'|'success'|'error'|'warning'} type - The notification type
 * @param {number} duration - Duration in milliseconds
 */
let currentToastTimeout = null;
function showToast(message, type = 'info', duration = 2000) {
    // Clear any existing toast timeout to prevent overlaps
    if (currentToastTimeout) {
        clearTimeout(currentToastTimeout);
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    
    // Add appropriate icon
    let icon = '';
    switch(type) {
        case 'success':
            icon = 'check_circle';
            break;
        case 'error':
            icon = 'error';
            break;
        case 'warning':
            icon = 'warning';
            break;
        default:
            icon = 'info';
    }
    
    toast.innerHTML = `<span class="material-icons toast-icon">${icon}</span>${message}`;

    // Append to body
    document.body.appendChild(toast);

    // Trigger reflow to enable transition
    void toast.offsetWidth;

    // Add 'show' class to trigger animation
    toast.classList.add('show');

    // Set timeout to hide and remove the toast
    currentToastTimeout = setTimeout(() => {
        toast.classList.remove('show');
        // Remove the element after the transition ends
        toast.addEventListener('transitionend', () => {
            if (toast.parentNode) {
                toast.remove();
            }
            currentToastTimeout = null; // Clear the timeout reference
        }, { once: true }); // Use once to auto-remove the listener

        // Fallback removal if transitionend doesn't fire
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
            if (currentToastTimeout) currentToastTimeout = null;
        }, 500);
    }, duration);
}

/**
 * Calls the Gemini API to optimize a prompt
 * @param {string} apiKey - The Gemini API key
 * @param {string} textToOptimize - The original prompt text
 * @param {string} systemPrompt - The system prompt/template to use
 * @param {string} modelName - The AI model to use
 * @param {number} temperature - The generation temperature
 * @returns {Promise<string>} - The optimized prompt
 */
async function callGeminiApi(apiKey, textToOptimize, systemPrompt, modelName = DEFAULT_MODEL, temperature = DEFAULT_TEMPERATURE) {
    // API endpoint
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
    
    // Request body
    const requestBody = {
        // Use dedicated system_instruction field
        system_instruction: {
            parts: [{
                text: systemPrompt
            }]
        },
        // User input goes in contents
        contents: [{
            parts: [{
                text: textToOptimize // Just the user input
            }]
        }],
        // Generation config
        generationConfig: {
            temperature: temperature,
            maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS
        }
    };

    // Request headers
    const headers = {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
    };

    // Make the API request
    let response;
    try {
        console.log(`Calling Gemini API with model: ${modelName}, temperature: ${temperature}`);
        
        response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        });
    } catch (networkError) {
        console.error("Network error during API call:", networkError);
        throw new Error(`Network request failed: ${networkError.message}`);
    }

    // Handle response status
    if (!response.ok) {
        let errorBodyText = await response.text();
        console.error("API Error Response:", errorBodyText);
        
        let errorMessage = `API request failed with status: ${response.status}`;
        try {
            const errorJson = JSON.parse(errorBodyText);
            if (errorJson.error && errorJson.error.message) {
                errorMessage += `. ${errorJson.error.message}`;
            } else {
                errorMessage += `. ${errorBodyText.substring(0, 100)}...`;
            }
        } catch (parseError) {
            errorMessage += `. ${errorBodyText.substring(0, 100)}...`;
        }
        throw new Error(errorMessage);
    }

    // Parse the response
    let data;
    try {
        data = await response.json();
        console.log("API Response received successfully");
    } catch (jsonError) {
        console.error("Error parsing API response JSON:", jsonError);
        const rawText = await response.text();
        console.error("Raw API response text:", rawText);
        throw new Error("Unable to parse API response.");
    }

    // Extract the optimized text
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        const extractedText = data.candidates[0].content.parts[0].text.trim();
        return extractedText;
    } else if (data.error) {
        console.error("API returned an error structure:", data.error);
        throw new Error(`API Error: ${data.error.message || JSON.stringify(data.error)}`);
    } else {
        console.error("Unexpected API response structure:", data);
        throw new Error("Unable to extract enhanced text from API response.");
    }
}

/**
 * Toggle the visibility of a collapsible element
 * @param {Element} header - The collapsible header element
 * @param {Element} content - The collapsible content element
 * @param {Element} icon - The icon element to rotate
 */
function toggleCollapsible(header, content, icon) {
    // Toggle the collapsed class on the content
    content.classList.toggle('collapsed');
    
    // Toggle the collapsed class on the icon to rotate it
    icon.classList.toggle('collapsed');
    
    // Store the state in localStorage
    const isCollapsed = content.classList.contains('collapsed');
    localStorage.setItem('settingsPanelCollapsed', isCollapsed);
}

/**
 * Check if text is dragover event is for a text file
 * @param {DragEvent} event - The drag event
 * @returns {boolean} - Whether the event contains a text file
 */
function isTextFileDrag(event) {
    if (event.dataTransfer.types.includes('Files')) {
        const items = event.dataTransfer.items;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file' && (item.type === 'text/plain' || item.type === '')) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Copy text to clipboard with modern navigator API or fallback
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Whether copy was successful
 */
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed'; // Avoid scrolling to bottom
            document.body.appendChild(textarea);
            textarea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textarea);
            return successful;
        }
    } catch (err) {
        console.error('Failed to copy text: ', err);
        return false;
    }
}