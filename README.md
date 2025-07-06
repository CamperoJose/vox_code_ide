# VOX Code IDE

![VoxCode (1)](https://github.com/user-attachments/assets/51be6290-5d50-48bd-8a91-c89fd2208616)

A voice-controlled integrated development environment designed to help programmers with motor disabilities and limitations through natural language voice recognition and artificial intelligence.

## Project Overview

VOX Code IDE is my final year project for the Systems Engineering degree at UCB (Universidad Católica Boliviana). This IDE allows programmers to code through natural voice commands, eliminating the need for complex command-line instructions that are difficult to memorize. Users can simply speak their intentions in their own words, making programming more accessible to everyone.

## Key Features

### Voice Recognition
- **Natural Language Processing**: Speak commands in your own words, not predefined syntax
- **AI-Powered Understanding**: Advanced voice recognition with artificial intelligence
- **Accessibility Focus**: Designed specifically for users with motor disabilities

### Integrated Development Environment
- **Cross-Platform Support**: Available for macOS, Windows, and Linux
- **Desktop Application**: Native desktop experience with Electron
- **Integrated Terminal**: Built-in terminal with full command-line capabilities
- **Code Editor**: Monaco Editor with syntax highlighting and IntelliSense
- **File Management**: Complete file system navigation and management
- **Chat History**: Persistent chat history for IDE interactions

### Screenshots
<img width="1680" alt="Captura de pantalla 2025-07-06 a la(s) 5 27 29 p  m" src="https://github.com/user-attachments/assets/674a35de-5e00-406d-8735-878bca3a7a3a" />

<img width="1675" alt="Captura de pantalla 2025-07-06 a la(s) 6 13 52 p  m" src="https://github.com/user-attachments/assets/ddc32624-d178-4a64-b188-56dcc27267bc" />

## Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 8.x
- **Git** (for cloning the repository)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/vox_code_ide.git
   cd vox_code_ide
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install development dependencies**
   ```bash
   npm install --save-dev electron-rebuild
   ```

4. **Rebuild native modules**
   ```bash
   npx electron-rebuild
   ```

5. **Configure environment variables**
   
   Copy the example environment file and configure your Google Cloud credentials:
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file with your Google Cloud Speech API credentials:
   ```bash
   # Google Cloud Speech API Credentials
   GOOGLE_APPLICATION_CREDENTIALS=./credencial.json
   ```
   
   **Important**: You need to create a Google Cloud service account and download the credentials JSON file. Place it in the project root as `credencial.json`.

6. **Start the development server**
   ```bash
   npm run dev
   ```

### Backend Setup

This IDE requires a backend server for voice processing and AI interactions. The backend repository can be found at:

**Backend Repository**: [https://github.com/CamperoJose/vox_code](https://github.com/CamperoJose/vox_code)

Please follow the installation instructions in the backend repository to set up the required server components.

### Security Notes

- The `.env` file and `credencial.json` are automatically ignored by Git
- Never commit your actual credentials to the repository
- Use the `.env.example` file as a template for your configuration
- Keep your Google Cloud service account credentials secure

## Usage

### Voice Commands

VOX Code IDE understands natural language commands. Here are some examples:

- "Create a function to check if a number is prime in java in line 3 in the current file"
- "Insert a command in the terminal to run 'npm run dev'"
- "Create a new file called index.html"
- "Open the folder test"
- "Open the terminal"
- "Save all files"
- "Run the current file"
- "Show me the file explorer"

### Interface Navigation

- **Voice Panel**: Access voice recognition features
- **File Manager**: Navigate and manage project files
- **Code Editor**: Write and edit code with full IDE features
- **Terminal**: Execute commands and run scripts
- **Chat History**: Review previous voice interactions

## 🛠️ Development

### Project Structure

```
vox_code_ide/
├── main.js                 # Main Electron process
├── preload.js             # Preload scripts
├── renderer/              # Frontend components
│   ├── index.html         # Main application window
│   ├── renderer.js        # Renderer process
│   ├── editor/           # Code editor components
│   ├── fileManager/      # File management
│   ├── terminal/         # Terminal integration
│   └── assets/          # Application assets
├── utils/                # Utility functions
│   ├── config.js        # Configuration management
│   ├── fileUtils.js     # File operations
│   ├── projectUtils.js  # Project utilities
│   ├── ptyUtils.js      # Terminal utilities
│   └── speechUtils.js   # Speech recognition
└── package.json         # Project dependencies
```

### Available Scripts

- `npm run dev` - Start the development server
- `npm test` - Run tests (currently not implemented)

**Made with ❤️ for the programming community**
