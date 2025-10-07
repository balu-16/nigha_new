import React from 'react';
import { AddDevices as AddDevicesComponent } from '@/components/AddDevices';

const AddDevices: React.FC = () => {
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
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            Add Devices
          </h1>
          <p className="text-muted-foreground">
            Scan QR codes or manually enter device codes to add devices to your account
          </p>
        </div>

        {/* Add Devices Component */}
        <div className="glass-light dark:glass rounded-2xl border border-primary/30 hover:border-primary/50 transition-all">
          <AddDevicesComponent />
        </div>
      </div>
    </div>
  );
};

export default AddDevices;