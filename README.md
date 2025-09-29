<div align="center">
  <img alt="PromptsCraft Logo" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" width="200" />
  <h1>PromptsCraft</h1>
  <p>A powerful and intuitive application for managing and organizing your AI prompts.</p>
</div>

## Features

- **📝 Rich Prompt Editor:** Create and edit prompts with a user-friendly editor.
- **🗂️ Folder Organization:** Organize your prompts into a hierarchical folder structure.
- **🏷️ Tagging System:** Add tags to your prompts for easy categorization and filtering.
- **🔍 Powerful Search:** Quickly find prompts by title, content, or tags.
- **🎨 Themeable UI:** Customize the look and feel of the application with different themes.
- **🔄 Drag & Drop:** Easily move prompts and folders to reorganize your library.
- **💻 Cross-platform:** Works on Windows, macOS, and Linux.

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Backend:** Node.js, Express
- **Database:** SQLite

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/promptscraft.git
    cd promptscraft
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up your Gemini API Key:**
    - Create a `.env` file in the root of the project.
    - Add your Gemini API key to the `.env` file:
      ```
      GEMINI_API_KEY=your_api_key_here
      ```

4.  **Run the development servers:**
    - **Frontend (Vite):**
      ```bash
      npm run dev
      ```
    - **Backend (Server):**
      ```bash
      npm run start:server
      ```

5.  **Open the application:**
    - Open your browser and navigate to `http://localhost:5173` (or the port specified by Vite).

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.

## License

This project is licensed under the MIT License.