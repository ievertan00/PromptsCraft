<div align="center">
  <img alt="PromptsCraft Logo" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" width="200" />
  <h1>PromptsCraft</h1>
  <p>A powerful and intuitive desktop application for creating, managing, and organizing your AI prompts.</p>
</div>

---

## ✨ Features

- **📝 Rich Prompt Editor:** Create and edit prompts with a user-friendly editor.
- **🧠 Multi-AI Model Support:** Seamlessly switch between different AI models like Gemini and Deepseek for prompt suggestions, refinement, and title generation.
- **🗂️ Hierarchical Folders:** Organize your prompts into a nested folder structure for better organization.
- **🏷️ Tagging System:** Add tags to your prompts for easy categorization and filtering.
- **⭐ Favorites & Quick Access:** Mark prompts as favorites and quickly access your most used tags.
- **🔍 Powerful Search:** Instantly find prompts by title, content, or tags.
- **🎨 Customizable Themes:** Switch between different themes to personalize your workspace.
- **🔄 Drag & Drop:** Easily move prompts and folders to reorganize your library.

## 📸 Screenshot

*A screenshot of the application will be added here soon.*

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** SQLite

## 🚀 Getting Started

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

3.  **Set up your AI API Keys:**
    - Create a `.env` file in the root of the project.
    - Add your API keys to the `.env` file. These keys are used for the server-side AI services.
      ```
      GEMINI_API_KEY=your_gemini_api_key_here
      DEEPSEEK_API_KEY=your_deepseek_api_key_here
      ```

4.  **Run the development servers:**
    This project has two separate processes that need to run concurrently:
    - **Backend Server:**
      ```bash
      npm run start:server
      ```
    - **Frontend (Vite):**
      ```bash
      npm run dev
      ```

5.  **Open the application:**
    - Open your browser and navigate to `http://localhost:3000`.

## 📂 Project Structure

```
/Users/evertan/gemini_project/PC/PromptsCraft/
├───.gitignore
├───App.tsx
├───index.tsx
├───server.ts
├───components/
│   ├───icons/
│   └───...
├───constants/
├───contexts/
├───services/
└───...
```

- `src/`: Contains the frontend source code.
- `src/components/`: Reusable React components.
- `src/services/`: Frontend API services and AI logic.
- `src/constants/`: Shared constants like colors and themes.
- `server.ts`: The backend Express server.
- `database.ts`: Database initialization and configuration.

## 📜 Available Scripts

In the `package.json` file, you will find the following scripts:

- `npm run dev`: Starts the frontend Vite development server.
- `npm run build`: Builds the frontend for production.
- `npm run preview`: Previews the production build locally.
- `npm run build:server`: Compiles the backend server.
- `npm run start:server`: Builds and starts the backend server with `nodemon` for auto-reloading.
- `npm run analyze`: Analyzes the bundle size of the production build.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.

## 📄 License

This project is licensed under the MIT License.