import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import SubscriptionGate from '@/components/SubscriptionGate';
import Layout from '@/components/shell/Layout';
import Copilot from '@/components/Copilot';
import Landing from '@/pages/marketing/Landing';
import PricingPage from '@/pages/marketing/Pricing';
import Services from '@/pages/marketing/Services';
import CustomerPortal from '@/pages/portal/CustomerPortal';
import Onboarding from '@/pages/portal/Onboarding';
import UrlTracker from '@/pages/portal/UrlTracker';
import AgentBuilder from '@/pages/portal/AgentBuilder';
import PortalSettings from '@/pages/portal/PortalSettings';
import AdminPortal from '@/pages/admin/AdminPortal';
import DeliveryGuarantee from '@/pages/DeliveryGuarantee';
import Dashboard from '@/pages/Dashboard';
import StartHere from '@/pages/StartHere';
import UrlScoreboard from '@/pages/UrlScoreboard';
import RankingProgress from '@/pages/RankingProgress';
import AreSheet from '@/pages/AreSheet';
import UrlWorkbook from '@/pages/UrlWorkbook';
import GrowthSimulator from '@/pages/GrowthSimulator';
import TwinOptimizer from '@/pages/TwinOptimizer';
import SeoStrategy from '@/pages/SeoStrategy';
import LoopMonitor from '@/pages/LoopMonitor';
import AlgorithmCrack from '@/pages/AlgorithmCrack';
import Clients from '@/pages/Clients';
import SearchMoneyMap from '@/pages/SearchMoneyMap';
import FastPaths from '@/pages/FastPaths';
import ExperimentLab from '@/pages/ExperimentLab';
import PaidOrganic from '@/pages/PaidOrganic';
import Financial from '@/pages/Financial';
import Replacement from '@/pages/Replacement';
import ProofVault from '@/pages/ProofVault';
import CompetitorIntelligence from '@/pages/CompetitorIntelligence';
import AIVisibility from '@/pages/AIVisibility';
import CompetitiveParity from '@/pages/CompetitiveParity';
import TechnologyRadar from '@/pages/TechnologyRadar';
import Research from '@/pages/Research';
import SEOGenerator from '@/pages/SEOGenerator';
import ModelLab from '@/pages/ModelLab';
import AgentControl from '@/pages/AgentControl';
import VisionCortex from '@/pages/VisionCortex';
import VisionCortexChat from '@/pages/VisionCortexChat';
import UltimateVision from '@/pages/UltimateVision';
import Capabilities from '@/pages/Capabilities';
import UrlCommand from '@/pages/UrlCommand';
import Ecosystem from '@/pages/Ecosystem';
import UniversalImplementer from '@/pages/UniversalImplementer';
import TractionScanner from '@/pages/TractionScanner';
import PromptLibrary from '@/pages/PromptLibrary';
import Vision from '@/pages/Vision';
import CloudBrowser from '@/pages/CloudBrowser';
import DailyResults from '@/pages/DailyResults';
import Domains from '@/pages/Domains';
import Indexing from '@/pages/Indexing';
import VercelDomains from '@/pages/VercelDomains';
import DnsSetup from '@/pages/DnsSetup';
import Infrastructure from '@/pages/Infrastructure';
import Connectors from '@/pages/Connectors';
import SystemHealth from '@/pages/SystemHealth';
import Admin from '@/pages/Admin';
import Settings from '@/pages/Settings';
import Provisioning from '@/pages/Provisioning';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      {/* Public Marketing Pages */}
      <Route path="/" element={<Landing />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/services" element={<Services />} />

      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Customer Portal — requires active subscription */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<SubscriptionGate />}>
          <Route path="/portal" element={<CustomerPortal />} />
          <Route path="/portal/onboarding" element={<Onboarding />} />
          <Route path="/portal/urls" element={<UrlTracker />} />
          <Route path="/portal/agents" element={<AgentBuilder />} />
          <Route path="/portal/settings" element={<PortalSettings />} />
        </Route>
      </Route>

      {/* Admin Portal */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<Layout />}>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/system" element={<AdminPortal />} />
          <Route path="/delivery" element={<DeliveryGuarantee />} />
          <Route path="/start" element={<StartHere />} />
          <Route path="/scoreboard" element={<UrlScoreboard />} />
          <Route path="/ranking-progress" element={<RankingProgress />} />
          <Route path="/sheet" element={<AreSheet />} />
          <Route path="/workbook" element={<UrlWorkbook />} />
          <Route path="/simulator" element={<GrowthSimulator />} />
          <Route path="/twin" element={<TwinOptimizer />} />
          <Route path="/strategy" element={<SeoStrategy />} />
          <Route path="/loop" element={<LoopMonitor />} />
          <Route path="/algorithm-crack" element={<AlgorithmCrack />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/money-map" element={<SearchMoneyMap />} />
          <Route path="/fastpaths" element={<FastPaths />} />
          <Route path="/experiments" element={<ExperimentLab />} />
          <Route path="/paid-organic" element={<PaidOrganic />} />
          <Route path="/financial" element={<Financial />} />
          <Route path="/replacement" element={<Replacement />} />
          <Route path="/proof" element={<ProofVault />} />
          <Route path="/competitors" element={<CompetitorIntelligence />} />
          <Route path="/ai-visibility" element={<AIVisibility />} />
          <Route path="/competitive-parity" element={<CompetitiveParity />} />
          <Route path="/technology-radar" element={<TechnologyRadar />} />
          <Route path="/research" element={<Research />} />
          <Route path="/seo-generator" element={<SEOGenerator />} />
          <Route path="/models" element={<ModelLab />} />
          <Route path="/agents" element={<AgentControl />} />
          <Route path="/vision-cortex" element={<VisionCortex />} />
          <Route path="/vision-cortex-chat" element={<VisionCortexChat />} />
          <Route path="/ultimate-vision" element={<UltimateVision />} />
          <Route path="/capabilities" element={<Capabilities />} />
          <Route path="/url-command" element={<UrlCommand />} />
          <Route path="/ecosystem" element={<Ecosystem />} />
          <Route path="/implement" element={<UniversalImplementer />} />
          <Route path="/traction" element={<TractionScanner />} />
          <Route path="/prompts" element={<PromptLibrary />} />
          <Route path="/vision" element={<Vision />} />
          <Route path="/cloud-browser" element={<CloudBrowser />} />
          <Route path="/daily" element={<DailyResults />} />
          <Route path="/domains" element={<Domains />} />
          <Route path="/indexing" element={<Indexing />} />
          <Route path="/domain-manager" element={<VercelDomains />} />
          <Route path="/dns-setup" element={<DnsSetup />} />
          <Route path="/infrastructure" element={<Infrastructure />} />
          <Route path="/connectors" element={<Connectors />} />
          <Route path="/system-health" element={<SystemHealth />} />
          <Route path="/admin-config" element={<Admin />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/provisioning" element={<Provisioning />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <Copilot />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App