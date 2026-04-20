import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { LangProvider } from "./lib/lang";
import { seedDemoData } from "./lib/demoData";
import { seedDemoComps, seedImportedComps } from "./lib/comps";
import Nav from "./components/Nav";
import Landing from "./pages/Landing";
import Screen from "./pages/Screen";
import Index from "./pages/Index";
import Cases from "./pages/Cases";
import CaseDetail from "./pages/CaseDetail";
import Market from "./pages/Market";
import Opportunities from "./pages/Opportunities";
import Comps from "./pages/Comps";

// Seed demo data on first load (idempotent)
seedDemoData();
seedDemoComps();
seedImportedComps();

export default function App() {
  return (
    <BrowserRouter>
      <LangProvider>
        <Toaster richColors position="top-right" />
        <Nav />
        <Routes>
          <Route path="/"          element={<Landing />} />
          <Route path="/screen"    element={<Screen />} />
          <Route path="/valuation" element={<Index />} />
          <Route path="/cases"     element={<Cases />} />
          <Route path="/cases/:id" element={<CaseDetail />} />
          <Route path="/market"        element={<Market />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/comps"         element={<Comps />} />
        </Routes>
      </LangProvider>
    </BrowserRouter>
  );
}
