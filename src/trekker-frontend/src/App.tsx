import { BrowserRouter, Route, Routes } from "react-router-dom"
import { AdminRoute } from "./components/AdminRoute/AdminRoute"
import Layout from "./components/Layout/Layout"
import AdminLoginPage from "./pages/AdminLoginPage/AdminLoginPage"
import AdminPage from "./pages/AdminPage/AdminPage"
import ChangePasswordPage from "./pages/ChangePasswordPage/ChangePasswordPage"
import LeaderboardPage from "./pages/LeaderboardPage/LeaderboardPage"
import NewMilestonePage from "./pages/NewMilestonePage/NewMilestonePage"
import LogPage from "./pages/LogPage/LogPage"
import MapPage from "./pages/MapPage/MapPage"
import NewAdminUserPage from "./pages/NewAdminUserPage/NewAdminUserPage"
import ResetUserPasswordPage from "./pages/ResetUserPasswordPage/ResetUserPasswordPage"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes — rendered inside the shared nav layout */}
        <Route element={<Layout />}>
          <Route index element={<MapPage />} />
          <Route path="log" element={<LogPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
        </Route>

        {/* Admin login — no nav shell, intentionally isolated */}
        <Route path="admin/login" element={<AdminLoginPage />} />

        {/* Protected admin routes — redirects to /admin/login if no token */}
        <Route element={<AdminRoute />}>
          <Route element={<Layout />}>
            <Route path="admin" element={<AdminPage />} />
            <Route path="admin/change-password" element={<ChangePasswordPage />} />
            <Route path="admin/new-user" element={<NewAdminUserPage />} />
            <Route path="admin/reset-user-password" element={<ResetUserPasswordPage />} />
            <Route path="admin/new-milestone" element={<NewMilestonePage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
