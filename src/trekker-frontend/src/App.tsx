import { BrowserRouter, Route, Routes } from "react-router-dom"
import Layout from "./components/Layout/Layout"
import AdminPage from "./pages/AdminPage/AdminPage"
import LogPage from "./pages/LogPage/LogPage"
import MapPage from "./pages/MapPage/MapPage"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<MapPage />} />
          <Route path="log" element={<LogPage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
