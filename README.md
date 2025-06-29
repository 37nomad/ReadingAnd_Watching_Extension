# Smart Tracker

Smart Tracker is a browser extension designed to help you build a private digital library of the content you consume online. It automatically logs the articles you read and videos you watch, using a local AI model to summarize them. You can then share your intellectual journey with friends you connect with.

## Overview

We all consume a vast amount of information online, but keeping a meaningful record of it is a challenge. Smart Tracker was created to solve this by providing an effortless way to curate your most insightful readings and viewings without any manual work.

The browser extension identifies significant content during your browsing sessions. A lightweight, privacy-preserving AI model running directly in your browser then summarizes this content and adds it to your personal library. This library is private by default but can be shared with friends. The sharing model is based on mutual consent: once two users accept each other's friend request, they can view each other's libraries.

## Core Features

* **Automated Content Logging:** The extension seamlessly tracks relevant articles and videos in the background.
* **AI-Powered Curation:** A local, in-browser language model analyzes and selects meaningful content.
* **Automatic Summaries:** Key insights from your content are condensed into brief summaries.
* **Private Friend-Based Sharing:** Your curated library is private. You can send and receive friend requests, and only upon mutual acceptance can you and a friend view each other's libraries.
* **Privacy-Focused:** All AI analysis happens locally in your browser, and your library is only shared with friends you approve.

## Technical Details

* **Backend:** Node.js, Express.js (API for user management, friendships, and data storage)
* **Frontend (Extension):** JavaScript, HTML, CSS
* **AI:** [WebLLM](https://github.com/mlc-ai/web-llm) running `Llama-3.2-1B-Instruct-q4f16_1-MLC`.
* **Database:** MongoDB

## Getting Started: Setup and Installation

Follow these instructions to get the project running on your local machine. The backend is required to handle user accounts, friendships, and data persistence for the extension.

### Prerequisites

Please ensure you have the following installed:
* [Node.js](https://nodejs.org/) (which includes npm)
* [Git](https://git-scm.com/)
* [Google Chrome](https://www.google.com/chrome/)

### 1. Clone the Repository

Start by cloning the project repository to your computer.
```bash
git clone https://github.com/37nomad/ReadingAnd_Watching_Extension.git
cd ReadingAnd_Watching_Extension
```

### 2. Configure and Run the Backend

The backend server is responsible for managing user data and API requests for the extension.

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
2.  **Create an Environment File:**
    Before installing dependencies, create a `.env` file in the `backend` directory. This file will store your environment variables.
    ```bash
    touch .env
    ```
    Open the `.env` file and add the following variables. Replace the placeholder values with your actual configuration details.
    ```env
    PORT=5000
    MONGODB_URI=your_mongodb_connection_string
    JWT_SECRET=your_super_secret_jwt_key
    ```
3.  **Install Dependencies:**
    ```bash
    npm install
    ```
4.  **Start the Server:**
    ```bash
    npm run dev
    ```
    The backend server will now be running on the port you specified (e.g., `http://localhost:5000`).

### 3. Build the Chrome Extension

The `smart-tracker` folder contains the source code for the browser extension.

1.  **Navigate to the extension directory** (from the project's root folder):
    ```bash
    cd ../smart-tracker
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **Build the Extension:**
    ```bash
    npm run build
    ```
    This command creates a `dist` folder containing the production-ready files for the extension.

### 4. Load the Extension in Chrome

Finally, load the built extension into your browser.

1.  Open Chrome and go to `chrome://extensions`.
2.  Enable **Developer mode** in the top-right corner.
3.  Click **Load unpacked**.
4.  Select the `smart-tracker/dist` folder from your project directory.

The Smart Tracker extension will now be active in your browser and connected to your local backend.

## How to Contribute

We welcome contributions. If you'd like to improve Smart Tracker, please feel free to fork the repository, make your changes, and submit a pull request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
