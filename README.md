# AI HTML Generator

This is a React-based web application that allows you to generate HTML, CSS, and JavaScript components using a text prompt powered by the Google Gemini AI API. It provides a real-time preview of the generated component and the corresponding code, which you can then copy and use in your projects.

![HTML Generator Screenshot](https://i.imgur.com/EWB1tnv.png)

## Features

- **AI-Powered Component Generation**: Describe the UI component you want in plain English, and the AI will generate the code for you.
- **Live Preview**: See the rendered HTML, CSS, and JS in a live preview panel.
- **Code Output**: View the generated HTML, CSS, and JavaScript in separate, copyable code blocks.
- **Iterative Improvement**: Refine and improve the generated component with further prompts.
- **Dark/Light Mode**: A sleek theme switcher for user comfort.
- **Resizable Layouts**: Toggle between horizontal and vertical layouts for the code and preview panels.
- **Responsive Design**: The application is designed to be responsive and user-friendly.
- **Skeleton Loaders**: A modern loading experience while components are being generated.
- **Auto-Hiding UI**: The header and input sections auto-hide on scroll for a less intrusive experience.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You need to have Node.js and npm (or yarn) installed on your machine.

- [Node.js](https://nodejs.org/) (which includes npm)

### Installation

1.  **Clone the repository:**

    ```sh
    git clone https://github.com/your-username/html-generator.git
    cd html-generator
    ```

2.  **Install NPM packages:**
    ```sh
    npm install
    ```

### Environment Configuration

This project requires a Google Gemini API key to function.

1.  Create a `.env` file in the root of your project directory:

    ```sh
    touch .env
    ```

2.  Add your Gemini API key to the `.env` file. The key must start with `REACT_APP_`.
    ```env
    REACT_APP_GEMINI_API_KEY=YOUR_API_KEY_HERE
    ```
    Replace `YOUR_API_KEY_HERE` with your actual API key from Google AI Studio.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes. You may also see any lint errors in the console.

### `npm test`

Launches the test runner in interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.
It correctly bundles React in production mode and optimizes the build for the best performance.

## Technologies Used

- **React**: A JavaScript library for building user interfaces.
- **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript.
- **Google Gemini API**: Used for the AI-powered code generation.
- **Shoelace**: A forward-thinking library of web components used for the skeleton loader.
- **React Resizable Panels**: For creating the resizable layouts.
- **Create React App**: Used to bootstrap the project.
