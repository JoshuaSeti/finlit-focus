import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { GlobalInstallBanner } from "@/components/layout/GlobalInstallBanner";
import { AppNotifyPrompt } from "@/components/layout/AppNotifyPrompt";
import { Analytics } from "@vercel/analytics/react";
import Index from "./pages/Index";
import About from "./pages/About";
import MemberWorld from "./pages/MemberWorld";
import ResourcesAndBlog from "./pages/ResourcesAndBlog";
import BlogPost from "./pages/BlogPost";
import Programs from "./pages/Programs";
import ProgramApply from "./pages/ProgramApply";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

// Auth pages
import AdminLogin from "./pages/auth/AdminLogin";
import FacilitatorLogin from "./pages/auth/FacilitatorLogin";

// Admin pages
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCarousel from "./pages/admin/AdminCarousel";
import AdminBlogs from "./pages/admin/AdminBlogs";
import AdminContacts from "./pages/admin/AdminContacts";
import AdminFacilitators from "./pages/admin/AdminFacilitators";
import AdminLessons from "./pages/admin/AdminLessons";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminFacilitatorResources from "./pages/admin/AdminFacilitatorResources";
import AdminAccounts from "./pages/admin/AdminAccounts";
import AdminTeamMembers from "./pages/admin/AdminTeamMembers";
import AdminPrograms from "./pages/admin/AdminPrograms";
import AdminApplications from "./pages/admin/AdminApplications";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminModules from "./pages/admin/AdminModules";

// Learner pages
import ModulesList from "./pages/modules/ModulesList";
import ModulePlayer from "./pages/modules/ModulePlayer";
import LearnerAuth from "./pages/modules/LearnerAuth";
import Account from "./pages/Account";
import Diagnostic from "./pages/modules/Diagnostic";

// Facilitator pages
import { FacilitatorLayout } from "./components/facilitator/FacilitatorLayout";
import FacilitatorDashboard from "./pages/facilitator/FacilitatorDashboard";
import FacilitatorLessons from "./pages/facilitator/FacilitatorLessons";
import FacilitatorNotifications from "./pages/facilitator/FacilitatorNotifications";
import FacilitatorResources from "./pages/facilitator/FacilitatorResources";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Analytics />
        <BrowserRouter>
          <ScrollToTop />
          <GlobalInstallBanner />
          <AppNotifyPrompt />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/team/:slug" element={<MemberWorld />} />
            <Route path="/resources-blog" element={<ResourcesAndBlog />} />
            <Route path="/blog/:id" element={<BlogPost />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/programs/:slug" element={<ProgramApply />} />
            <Route path="/diagnostic" element={<Diagnostic />} />
            <Route path="/modules" element={<ModulesList />} />
            <Route path="/modules/:slug" element={<ModulePlayer />} />
            <Route path="/login" element={<LearnerAuth />} />
            <Route path="/account" element={<Account />} />
            <Route path="/sandbox/*" element={<Navigate to="/modules" replace />} />
            <Route path="/learn/*" element={<Navigate to="/modules" replace />} />
            <Route path="/contact" element={<Contact />} />
            
            {/* Auth Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/facilitator/login" element={<FacilitatorLogin />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="carousel" element={<AdminCarousel />} />
              <Route path="blogs" element={<AdminBlogs />} />
              <Route path="contacts" element={<AdminContacts />} />
              <Route path="facilitators" element={<AdminFacilitators />} />
              <Route path="lessons" element={<AdminLessons />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="facilitator-resources" element={<AdminFacilitatorResources />} />
              <Route path="programs" element={<AdminPrograms />} />
              <Route path="applications" element={<AdminApplications />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
              <Route path="admins" element={<AdminAccounts />} />
              <Route path="team-members" element={<AdminTeamMembers />} />
              <Route path="modules" element={<AdminModules />} />
            </Route>
            
            {/* Facilitator Routes */}
            <Route path="/facilitator" element={<FacilitatorLayout />}>
              <Route index element={<FacilitatorDashboard />} />
              <Route path="lessons" element={<FacilitatorLessons />} />
              <Route path="notifications" element={<FacilitatorNotifications />} />
              <Route path="resources" element={<FacilitatorResources />} />
            </Route>
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
