import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./App.css";
import OldLandingPage from "./pages/LandingPage";
import LandingPage from "./ui-new/pages/LandingPage";
import DashboardPage from "./ui-new/pages/DashboardPage";
import SignInPage from "./ui-new/pages/SignInPage";
import SignUpPage from "./ui-new/pages/SignUpPage";
import AccordionPanel from "./components/AccordionPanel";
import { defaultAccordionItems } from "./components/accordion/accordionItems";
import ChatBox from "./components/ChatBox";
import { TabProvider } from "./contexts/TabContext";
import { WidgetInfoProvider } from "./contexts/WidgetInfoProvider";
import { PromptProvider } from "./contexts/PromptContext";
import { ViewModeProvider } from "./contexts/ViewModeContext";
import { useArtifactStore } from "./store/useArtifactStore";
import { ArtifactRoot } from "./artifacts/ArtifactRoot";
import MapViewComponent from "./pages/MapView";
import { DashboardLayout } from "./ui-new/components/layout";

const queryClient = new QueryClient();

function AppContent() {
  const { activeArtifact } = useArtifactStore();

  return (
    <DashboardLayout
      mapComponent={<MapViewComponent />}
      chatComponent={<ChatBox />}
      accordionComponent={<AccordionPanel items={defaultAccordionItems} />}
      artifactComponent={
        activeArtifact ? <ArtifactRoot artifact={activeArtifact} /> : undefined
      }
      isArtifactActive={!!activeArtifact}
      userName="Guest User"
      userPlan="Free Plan"
    />
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WidgetInfoProvider
        widgetId={import.meta.env.VITE_WIDGET_ID || "default-widget-id"}
        hostUrl={import.meta.env.VITE_API_BASE_URL || window.location.origin}
      >
        <Router>
          <Routes>
            {/* New UI Routes - Using original routes */}
            <Route
              path="/"
              element={
                <PromptProvider>
                  <LandingPage />
                </PromptProvider>
              }
            />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            {/* Dashboard - Authenticated landing page with sidebar */}
            <Route
              path="/dashboard"
              element={
                <PromptProvider>
                  <TabProvider>
                    <ViewModeProvider>
                      <DashboardPage />
                    </ViewModeProvider>
                  </TabProvider>
                </PromptProvider>
              }
            />
            <Route
              path="/map"
              element={
                <PromptProvider>
                  <TabProvider>
                    <AppContent />
                  </TabProvider>
                </PromptProvider>
              }
            />
            {/* Old UI Routes - Legacy routes */}
            <Route
              path="/old-landing"
              element={
                <PromptProvider>
                  <OldLandingPage />
                </PromptProvider>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </WidgetInfoProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
