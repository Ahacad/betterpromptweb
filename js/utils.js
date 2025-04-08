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
    toast.textContent = message;

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
        console.log("API Response Data:", data);
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
        throw new Error("Unable to extract optimized text from API response.");
    }
}