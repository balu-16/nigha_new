import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Smartphone, Send, Download, BarChart3 } from 'lucide-react';
import { AddDevices } from '@/components/AddDevices';
import { CustomerDevices } from '@/components/CustomerDevices';
import { SentDevices } from '@/components/SentDevices';
import { ReceivedDevices } from '@/components/ReceivedDevices';
import { CircularGauge } from '@/components/CircularGauge';
import { TemperatureChart } from '@/components/TemperatureChart';
import { DistanceChart } from '@/components/DistanceChart';
import { PressureAnalysis } from '@/components/PressureAnalysis';

export const CustomerDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('analytics');

  // Handle URL hash changes to switch tabs
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    const validTabs = ['analytics', 'add-devices', 'devices', 'sent-devices', 'received-devices'];
    
    if (hash && validTabs.includes(hash)) {
      setActiveTab(hash);
    } else {
      // Default to analytics when no hash or invalid hash
      setActiveTab('analytics');
    }
  }, [location.hash]);

  // Update URL hash when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/dashboard#${value}`, { replace: true });
  };

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

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-5 glass-light dark:glass border border-primary/30">
        <TabsTrigger value="analytics" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">Analytics</span>
        </TabsTrigger>
        <TabsTrigger value="add-devices" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Devices</span>
        </TabsTrigger>
        <TabsTrigger value="devices" className="flex items-center gap-2">
          <Smartphone className="h-4 w-4" />
          <span className="hidden sm:inline">Devices</span>
        </TabsTrigger>
        <TabsTrigger value="sent-devices" className="flex items-center gap-2">
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">Sent</span>
        </TabsTrigger>
        <TabsTrigger value="received-devices" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Received</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="analytics" className="space-y-8 mt-8">
        <IndustrialDashboardContent />
      </TabsContent>

      <TabsContent value="add-devices" className="mt-8">
        <AddDevices />
      </TabsContent>

      <TabsContent value="devices" className="mt-8">
        <CustomerDevices />
      </TabsContent>

      <TabsContent value="sent-devices" className="mt-8">
        <SentDevices />
      </TabsContent>

      <TabsContent value="received-devices" className="mt-8">
        <ReceivedDevices />
      </TabsContent>
    </Tabs>
  );
};