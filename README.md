# BetterPrompt

BetterPrompt is a tool that helps you optimize your AI prompts to get better responses from AI systems.

## Features

- Optimize your prompts with advanced algorithms
- Multiple optimization templates (default, concise, detailed, custom)
- Model selection for Gemini API
- Temperature adjustment for controlling creativity vs. consistency
- Store your API key locally in your browser
- Simple, intuitive interface

## Getting Started

Visit [The Web Page](https://ahacad.github.io/betterpromptweb) to use BetterPrompt directly in your browser.

### Prerequisites

- A Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
- A modern web browser

### Using BetterPrompt

1. Enter your Gemini API key in the settings section
2. Select a template type (default, concise, detailed, or custom)
3. Enter your original prompt in the left panel
4. Click "Optimize Prompt" to generate an improved version
5. Copy the optimized result from the right panel

## Development

### Local Setup

1. Clone the repository:
   ```
   git clone https://github.com/ahacad/betterpromptweb.git
   ```

2. Navigate to the website directory:
   ```
   cd betterpromptweb/website
   ```

3. Open `index.html` in your browser or use a local development server.

### Project Structure

- `index.html` - Main application page
- `css/styles.css` - Styling for the application
- `js/config.js` - Configuration settings and constants
- `js/utils.js` - Utility functions
- `js/main.js` - Main application logic

## Deployment

This project is designed to be deployed to GitHub Pages:

1. Push your changes to the GitHub repository
2. Go to the repository settings and enable GitHub Pages
3. Choose the appropriate branch and folder for deployment

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Originally developed as a [Chrome extension](https://github.com/gm365/BetterPrompt)
- Uses the Google Gemini API for prompt optimization
