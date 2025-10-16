import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Smartphone, Send, Download } from 'lucide-react';
import { AddDevices } from '@/components/AddDevices';
import { CustomerDevices } from '@/components/CustomerDevices';
import { SentDevices } from '@/components/SentDevices';
import { ReceivedDevices } from '@/components/ReceivedDevices';

export const CustomerDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('add-devices');

  // Handle URL hash changes to switch tabs
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    const validTabs = ['add-devices', 'devices', 'sent-devices', 'received-devices'];
    
    if (hash && validTabs.includes(hash)) {
      setActiveTab(hash);
    } else {
      // Default to add-devices when no hash or invalid hash
      setActiveTab('add-devices');
    }
  }, [location.hash]);

  // Update URL hash when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/dashboard#${value}`, { replace: true });
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-4 glass-light dark:glass border border-primary/30">
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