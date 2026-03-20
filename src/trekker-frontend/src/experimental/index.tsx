// ---------------------------------------------------------------------------
// Experimental Build — Drop-in App Replacement
//
// To preview the experimental design, update main.tsx:
//
//   import App from './App'                  // production (default)
//   import App from './experimental/index'   // experimental preview
//
// The experimental build uses the same API, same auth flow, same AdminRoute
// guard, and same AdminLoginPage — only the three visual components change.
// ---------------------------------------------------------------------------

import { BrowserRouter, Route, Routes } from "react-router-dom"
import { AdminRoute } from "../components/AdminRoute/AdminRoute"
import AdminLoginPage from "../pages/AdminLoginPage/AdminLoginPage"
import AdminPage from "../pages/AdminPage/AdminPage"
import Layout from "./Layout/Layout"
import LogPage from "./LogPage/LogPage"
import MapPage from "./MapPage/MapPage"

export default function ExperimentalApp() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes — experimental Layout shell */}
        <Route element={<Layout />}>
          <Route index element={<MapPage />} />
          <Route path="log" element={<LogPage />} />
        </Route>

        {/* Admin login — no nav shell, unchanged from production */}
        <Route path="admin/login" element={<AdminLoginPage />} />

        {/* Protected admin — experimental Layout shell */}
        <Route element={<AdminRoute />}>
          <Route element={<Layout />}>
            <Route path="admin" element={<AdminPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
