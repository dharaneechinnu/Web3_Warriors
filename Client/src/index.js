import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import App from "./App"
import { createGlobalStyle } from "styled-components"

const GlobalStyle = createGlobalStyle`
  :root {
    --background: #0A0F1C;
    --foreground: #ffffff;
    --primary: #7c3aed;
    --primary-foreground: #ffffff;
    --secondary: #4f46e5;
    --secondary-foreground: #ffffff;
    --accent: rgba(124, 58, 237, 0.1);
    --accent-foreground: #ffffff;
    --muted: rgba(255, 255, 255, 0.1);
    --muted-foreground: rgba(255, 255, 255, 0.5);
    --card: rgba(30, 30, 46, 0.7);
    --card-foreground: #ffffff;
    --border: rgba(124, 58, 237, 0.2);
    --input: rgba(30, 30, 46, 0.6);
    --ring: rgba(124, 58, 237, 0.3);
    --radius: 0.5rem;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: var(--background);
    color: var(--foreground);
    line-height: 1.5;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button, input, select, textarea {
    font-family: inherit;
  }

  h1, h2, h3, h4, h5, h6 {
    font-weight: 700;
    line-height: 1.2;
  }

  img {
    max-width: 100%;
    height: auto;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(124, 58, 237, 0.5);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(124, 58, 237, 0.7);
  }
`

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(
  <React.StrictMode>
    <GlobalStyle />
    <App />
  </React.StrictMode>,
)

