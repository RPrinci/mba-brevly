import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/home";
import { RedirectPage } from "./pages/redirect";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/r/:shortCode" element={<RedirectPage />} />
        {/* Catch-all route for direct short URLs */}
        <Route path="/:shortCode" element={<RedirectPage />} />
      </Routes>
    </BrowserRouter>
  );
}
