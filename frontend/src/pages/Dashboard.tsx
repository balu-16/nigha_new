import { useState } from 'react';
import { CircularGauge } from '@/components/CircularGauge';
import { TemperatureChart } from '@/components/TemperatureChart';
import { DistanceChart } from '@/components/DistanceChart';
import { PressureAnalysis } from '@/components/PressureAnalysis';
import { UserManagement } from '@/components/UserManagement';
import { AdminManagement } from '@/components/AdminManagement';
import { DeviceManagement } from '@/components/DeviceManagement';
import { CustomerDashboard } from '@/components/CustomerDashboard';
import { AddUserDialog } from '@/components/AddUserDialog';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, BarChart3, Shield, Smartphone } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [selectedUserToDelete, setSelectedUserToDelete] = useState<User | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isSuperAdmin = user?.role === 'superadmin';

  const handleAddUser = () => {
    setAddUserDialogOpen(true);
  };

  const handleDeleteUser = (userToDelete: User) => {
    setSelectedUserToDelete(userToDelete);
    setDeleteUserDialogOpen(true);
  };

  const handleUserAdded = () => {
    setRefreshTrigger(prev => prev + 1);
    setAddUserDialogOpen(false);
  };

  const handleUserDeleted = () => {
    setRefreshTrigger(prev => prev + 1);
    setDeleteUserDialogOpen(false);
    setSelectedUserToDelete(null);
  };

  return (
    <div className="min-h-screen overflow-y-auto custom-scrollbar relative">
      {/* Animated background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-pulse-glow" />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-accent rounded-full animate-pulse-glow delay-150" />
        <div className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-pulse-glow delay-300" />
      </div>

      <div className="relative z-10 p-8 space-y-8">
        {/* Header */}
        <div className="glass-light dark:glass p-6 rounded-2xl border border-primary/30 neon-border-cyan">
          <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            {isAdmin ? 'Admin Dashboard' : 'Industrial Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            {isAdmin ? 'System administration and monitoring' : 'Real-time monitoring and analytics'}
          </p>
        </div>

        {/* Admin/SuperAdmin Tabs */}
        {isAdmin ? (
          <Tabs defaultValue="analytics" className="w-full">
            <TabsList className={`grid w-full ${isSuperAdmin ? 'grid-cols-4' : 'grid-cols-3'} glass-light dark:glass border border-primary/30`}>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                User Management
              </TabsTrigger>
              <TabsTrigger value="devices" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Device Management
              </TabsTrigger>
              {isSuperAdmin && (
                <TabsTrigger value="admins" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Admin Management
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="analytics" className="space-y-8 mt-8">
              {/* Industrial Dashboard Content */}
              <IndustrialDashboardContent />
            </TabsContent>
            
            <TabsContent value="users" className="mt-8">
              <UserManagement
                key={refreshTrigger}
                onAddUser={handleAddUser}
                onDeleteUser={handleDeleteUser}
              />
            </TabsContent>
            
            <TabsContent value="devices" className="mt-8">
              <DeviceManagement key={refreshTrigger} />
            </TabsContent>
            
            {isSuperAdmin && (
              <TabsContent value="admins" className="mt-8">
                <AdminManagement
                  key={refreshTrigger}
                  onAddUser={handleAddUser}
                  onDeleteUser={handleDeleteUser}
                />
              </TabsContent>
            )}
          </Tabs>
        ) : (
          /* Customer Dashboard with Device Management */
          <CustomerDashboard />
        )}
      </div>

      {/* Dialogs */}
      <AddUserDialog
        open={addUserDialogOpen}
        onOpenChange={setAddUserDialogOpen}
        onUserAdded={handleUserAdded}
      />

      <ConfirmDeleteDialog
        open={deleteUserDialogOpen}
        onOpenChange={setDeleteUserDialogOpen}
        user={selectedUserToDelete}
        onUserDeleted={handleUserDeleted}
      />

      <style>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, hsl(var(--primary) / 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--primary) / 0.1) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .delay-150 {
          animation-delay: 150ms;
        }

        .delay-300 {
          animation-delay: 300ms;
        }
      `}</style>
    </div>
  );
};

// Separate component for the industrial dashboard content
const IndustrialDashboardContent = () => {
  return (
    <>
      {/* Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-light dark:glass rounded-2xl p-6 border border-primary/30 neon-border-cyan flex justify-center items-center hover:scale-105 transition-transform">
          <CircularGauge value={1200} maxValue={2000} label="Pressure" unit="PSI" color="cyan" />
        </div>
        <div className="glass-light dark:glass rounded-2xl p-6 border border-accent/30 neon-border-cyan flex justify-center items-center hover:scale-105 transition-transform">
          <CircularGauge value={900} maxValue={1500} label="Distance" unit="CM" color="magenta" />
        </div>
        <div className="glass-light dark:glass rounded-2xl p-6 border border-primary/30 neon-border-cyan flex justify-center items-center hover:scale-105 transition-transform">
          <CircularGauge value={350} maxValue={500} label="Temperature" unit="°C" color="orange" />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-light dark:glass rounded-2xl border border-primary/30 hover:border-primary/50 transition-all">
          <TemperatureChart />
        </div>
        <div className="glass-light dark:glass rounded-2xl border border-primary/30 hover:border-primary/50 transition-all">
          <DistanceChart />
        </div>
      </div>

      {/* Pressure Analysis */}
      <div className="glass-light dark:glass rounded-2xl border border-primary/30 hover:border-primary/50 transition-all">
        <PressureAnalysis />
      </div>
    </>
  );
};

export default Dashboard;
