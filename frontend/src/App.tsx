import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { RefreshTimerProvider } from "@/contexts/RefreshTimerContext";
import { PrivateRoute } from "@/components/PrivateRoute";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DeviceManagement } from "@/components/DeviceManagement";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import RoleBasedDashboard from "./components/RoleBasedDashboard";
import Devices from "./pages/Devices";
import AddDevices from "./pages/AddDevices";

import UserManagement from "./pages/UserManagement";
import AdminManagement from "./pages/AdminManagement";
import Settings from "./pages/Settings";
import CustomerSettings from "./pages/CustomerSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              {/* Protected Routes with Sidebar */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <div className="flex min-h-screen w-full">
                      <DashboardSidebar />
                      <main className="flex-1 ml-20">
                        <RoleBasedDashboard />
                      </main>
                    </div>
                  </PrivateRoute>
                }
              />
              <Route
                path="/devices"
                element={
                  <PrivateRoute>
                    <div className="flex min-h-screen w-full">
                      <DashboardSidebar />
                      <main className="flex-1 ml-20">
                        <Devices />
                      </main>
                    </div>
                  </PrivateRoute>
                }
              />
              <Route
                path="/add-devices"
                element={
                  <PrivateRoute>
                    <div className="flex min-h-screen w-full">
                      <DashboardSidebar />
                      <main className="flex-1 ml-20">
                        <AddDevices />
                      </main>
                    </div>
                  </PrivateRoute>
                }
              />

              <Route
                path="/user-management"
                element={
                  <PrivateRoute>
                    <div className="flex min-h-screen w-full">
                      <DashboardSidebar />
                      <main className="flex-1 ml-20">
                        <UserManagement />
                      </main>
                    </div>
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin-management"
                element={
                  <PrivateRoute>
                    <div className="flex min-h-screen w-full">
                      <DashboardSidebar />
                      <main className="flex-1 ml-20">
                        <AdminManagement />
                      </main>
                    </div>
                  </PrivateRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <PrivateRoute>
                    <div className="flex min-h-screen w-full">
                      <DashboardSidebar />
                      <main className="flex-1 ml-20">
                        <Settings />
                      </main>
                    </div>
                  </PrivateRoute>
                }
              />
              <Route
                path="/customer-settings"
                element={
                  <PrivateRoute>
                    <RefreshTimerProvider>
                      <div className="flex min-h-screen w-full">
                        <DashboardSidebar />
                        <main className="flex-1 ml-20">
                          <CustomerSettings />
                        </main>
                      </div>
                    </RefreshTimerProvider>
                  </PrivateRoute>
                }
              />
              <Route
                path="/device-management"
                element={
                  <PrivateRoute>
                    <div className="flex min-h-screen w-full">
                      <DashboardSidebar />
                      <main className="flex-1 ml-20">
                        <DeviceManagement />
                      </main>
                    </div>
                  </PrivateRoute>
                }
              />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
