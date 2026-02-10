import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { Analytics } from "@vercel/analytics/react";
import Index from "./pages/Index";
import About from "./pages/About";
import ResourcesAndBlog from "./pages/ResourcesAndBlog";
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
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/resources-blog" element={<ResourcesAndBlog />} />
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
              <Route path="admins" element={<AdminAccounts />} />
              <Route path="team-members" element={<AdminTeamMembers />} />
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
