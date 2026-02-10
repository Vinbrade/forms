import { Index } from "./pages/Index";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import FormEditor from "./pages/FormEditor";
import FormViewer from "./pages/FormViewer";
import PublicForm from "./pages/PublicForm";
import { ThemeProvider } from "./contexts/ThemeContext";
import NoPage from "./pages/NoPage";
import { Toaster as Sonner } from "@/components/ui/sonner";

export function App() {
return (
  <ThemeProvider>
    <Sonner />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/edit-form/:id" element={<FormEditor />} />
        <Route path="/form-viewer/:id" element={<FormViewer />} />
        <Route path="/form/:id" element={<PublicForm />} />
        <Route path="*" element={<NoPage />} />
      </Routes>
    </BrowserRouter>
  </ThemeProvider>
);
}

export default App;