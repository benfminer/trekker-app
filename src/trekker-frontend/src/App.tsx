import { BrowserRouter, Route, Routes } from "react-router-dom"
import { AdminRoute } from "./components/AdminRoute/AdminRoute"
import Layout from "./components/Layout/Layout"
import AdminLoginPage from "./pages/AdminLoginPage/AdminLoginPage"
import AdminPage from "./pages/AdminPage/AdminPage"
import LogPage from "./pages/LogPage/LogPage"
import MapPage from "./pages/MapPage/MapPage"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes — rendered inside the shared nav layout */}
        <Route element={<Layout />}>
          <Route index element={<MapPage />} />
          <Route path="log" element={<LogPage />} />
        </Route>

        {/* Admin login — no nav shell, intentionally isolated */}
        <Route path="admin/login" element={<AdminLoginPage />} />

        {/* Protected admin routes — redirects to /admin/login if no token */}
        <Route element={<AdminRoute />}>
          <Route element={<Layout />}>
            <Route path="admin" element={<AdminPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
