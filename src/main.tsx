import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./embed.css";

// Check if is embedded and add class to body/html
const isEmbed = window.location.search.includes('embed=true');
if (isEmbed) {
  document.documentElement.classList.add('is-embedded');
  document.body.classList.add('is-embedded');
  const root = document.getElementById('root');
  if (root) root.classList.add('is-embedded');
}

createRoot(document.getElementById("root")!).render(<App />);