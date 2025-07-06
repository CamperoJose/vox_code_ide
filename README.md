# VOX Code IDE

A voice-controlled integrated development environment designed to help programmers with motor disabilities and limitations through natural language voice recognition and artificial intelligence.

## 🎯 Project Overview

VOX Code IDE is my final year project for the Systems Engineering degree at UCB (Universidad Católica Boliviana). This innovative IDE allows programmers to code through natural voice commands, eliminating the need for complex command-line instructions that are difficult to memorize. Users can simply speak their intentions in their own words, making programming more accessible to everyone.

## ✨ Key Features

### 🎤 Voice Recognition
- **Natural Language Processing**: Speak commands in your own words, not predefined syntax
- **AI-Powered Understanding**: Advanced voice recognition with artificial intelligence
- **Accessibility Focus**: Designed specifically for users with motor disabilities

### 💻 Integrated Development Environment
- **Cross-Platform Support**: Available for macOS, Windows, and Linux
- **Desktop Application**: Native desktop experience with Electron
- **Integrated Terminal**: Built-in terminal with full command-line capabilities
- **Code Editor**: Monaco Editor with syntax highlighting and IntelliSense
- **File Management**: Complete file system navigation and management
- **Chat History**: Persistent chat history for IDE interactions

### 🔧 Technical Features
- **Monaco Editor**: Professional code editing experience
- **Xterm.js Terminal**: Full-featured terminal emulation
- **Google Cloud Speech**: High-accuracy voice recognition
- **Electron Framework**: Cross-platform desktop application
- **Node.js Backend**: Robust server-side processing

## 🚀 Getting Started

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

5. **Start the development server**
   ```bash
   npm run dev
   ```

### Backend Setup

This IDE requires a backend server for voice processing and AI interactions. The backend repository can be found at:

**Backend Repository**: [https://github.com/CamperoJose/vox_code](https://github.com/CamperoJose/vox_code)

Please follow the installation instructions in the backend repository to set up the required server components.

## 🎮 Usage

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