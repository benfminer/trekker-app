import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import { checkApiHealth } from "./lib/api.ts"

// Fire-and-forget — confirms Rails API is reachable on app load.
checkApiHealth()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
