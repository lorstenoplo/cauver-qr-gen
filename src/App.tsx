import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Home";
import QRScanner from "./pages/Admin";
import Search from "./pages/Search";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/scanner" element={<QRScanner />} />
        <Route path="search" element={<Search />} />
      </Routes>
    </Router>
  );
}
