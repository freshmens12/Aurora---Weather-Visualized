import { Routes, Route, Navigate } from "react-router-dom";
import Today from "./pages/Today.jsx";
import Compare from "./pages/Compare.jsx";
import NotFound from "./pages/NotFound.jsx";
import Layout from "./components/Layout.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/today" replace />} />
        <Route path="/today" element={<Today />} />
        <Route path="/compare" element={<Compare />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
