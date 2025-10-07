import { Smartphone, Activity, Battery, Wifi, Share2, Trash2, Download, Eye, MoreHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/use-toast';

interface Device {
  id: number;
  device_code: string;
  device_name: string;
  device_m2m_number?: string;
  assigned_to: string | null;
  assigned_user_name?: string;
  created_at: string;
  is_active?: boolean;
}

const Devices = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [sharePhoneNumber, setSharePhoneNumber] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/devices/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const result = await response.json();
      if (result.success && result.data) {
        setDevices(result.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch devices",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast({
        title: "Error",
        description: "Failed to fetch devices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get device status
  const getDeviceStatus = (device: Device) => {
    if (device.assigned_to) {
      return device.is_active ? 'Active' : 'Inactive';
    }
    return 'Unassigned';
  };

  // Helper function to get mock battery level (since we don't have real battery data)
  const getMockBattery = (deviceId: number) => {
    // Generate consistent mock battery based on device ID
    return 60 + (deviceId % 40);
  };

  // Helper function to get mock signal strength
  const getMockSignal = (deviceId: number) => {
    const signals = ['Strong', 'Medium', 'Weak'];
    return signals[deviceId % 3];
  };

  // Device action functions
  const handleShareDevice = (device: Device) => {
    setSelectedDevice(device);
    setShareDialogOpen(true);
  };

  const handleDeleteDevice = async (device: Device) => {
    if (window.confirm(`Are you sure you want to delete ${device.device_name}?`)) {
      try {
        const response = await fetch(`http://localhost:3001/devices/${device.device_code}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        if (response.ok) {
          setDevices(devices.filter(d => d.id !== device.id));
          toast({
            title: "Success",
            description: "Device deleted successfully",
          });
        } else {
          throw new Error('Failed to delete device');
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete device",
          variant: "destructive",
        });
      }
    }
  };

  const handleDownloadDevice = (device: Device) => {
    // Create device data for download
    const deviceData = {
      id: device.id,
      name: device.device_name,
      code: device.device_code,
      addedDate: formatDate(device.created_at),
      status: getDeviceStatus(device),
      createdAt: device.created_at,
    };

    const dataStr = JSON.stringify(deviceData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `device-${device.device_code}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Device data downloaded successfully",
    });
  };

  const handleViewDetails = (device: Device) => {
    // For now, show device details in a toast
    toast({
      title: device.device_name,
      description: `Code: ${device.device_code}\nStatus: ${getDeviceStatus(device)}\nAdded: ${formatDate(device.created_at)}`,
    });
  };

  const submitShareDevice = async () => {
    if (!selectedDevice || !sharePhoneNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a phone number",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/devices/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          deviceId: selectedDevice.id,
          recipientPhone: sharePhoneNumber,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Device shared successfully with ${sharePhoneNumber}`,
        });
        setShareDialogOpen(false);
        setSharePhoneNumber('');
        setSelectedDevice(null);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to share device');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to share device",
        variant: "destructive",
      });
    }
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
          <div className="flex items-center gap-3">
            <Smartphone className="w-8 h-8 text-primary neon-glow-cyan" />
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                Connected Devices
              </h1>
              <p className="text-muted-foreground">Monitor and manage all industrial sensors</p>
            </div>
          </div>
        </div>
    
        {/* Device Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-light dark:glass rounded-2xl p-6 border border-primary/30 hover:border-primary/50 transition-all hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Devices</p>
                <p className="text-3xl font-bold text-primary">
                  {loading ? '...' : devices.length}
                </p>
              </div>
              <Smartphone className="w-10 h-10 text-primary neon-glow-cyan" />
            </div>
          </div>

          <div className="glass-light dark:glass rounded-2xl p-6 border border-primary/30 hover:border-primary/50 transition-all hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Assigned</p>
                <p className="text-3xl font-bold text-primary">
                  {loading ? '...' : devices.filter(d => d.assigned_to !== null).length}
                </p>
              </div>
              <Activity className="w-10 h-10 text-primary neon-glow-cyan" />
            </div>
          </div>

          <div className="glass-light dark:glass rounded-2xl p-6 border border-accent/30 hover:border-accent/50 transition-all hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unassigned</p>
                <p className="text-3xl font-bold text-accent">
                  {loading ? '...' : devices.filter(d => d.assigned_to === null).length}
                </p>
              </div>
              <Activity className="w-10 h-10 text-accent neon-glow-magenta" />
            </div>
          </div>

          <div className="glass-light dark:glass rounded-2xl p-6 border border-primary/30 hover:border-primary/50 transition-all hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Battery</p>
                <p className="text-3xl font-bold text-primary">
                  {loading ? '...' : devices.length > 0 ? 
                    Math.round(devices.reduce((acc, d) => acc + getMockBattery(d.id), 0) / devices.length) : 0}%
                </p>
              </div>
              <Battery className="w-10 h-10 text-primary neon-glow-cyan" />
            </div>
          </div>
        </div>

        {/* Devices List */}
        <div className="glass-light dark:glass rounded-2xl p-6 border border-primary/30">
          <h2 className="text-xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            Device Status
          </h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">Loading devices...</span>
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-12">
              <Smartphone className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No devices found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-primary/20">
                    <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Device</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Code</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Added Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Status</th>
                    <th className="text-center py-3 px-4 font-semibold text-sm text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((device) => {
                    const status = getDeviceStatus(device);
                    
                    return (
                      <tr
                        key={device.id}
                        className="border-b border-primary/10 hover:bg-primary/5 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <Smartphone className="w-5 h-5 text-primary neon-glow-cyan" />
                            <div>
                              <p className="font-semibold">{device.device_name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-muted-foreground">{device.device_code}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-muted-foreground">
                            {formatDate(device.created_at)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              status === 'Active'
                                ? 'bg-primary/20 text-primary border border-primary/30'
                                : status === 'Inactive'
                                ? 'bg-accent/20 text-accent border border-accent/30'
                                : 'bg-muted/20 text-muted-foreground border border-muted/30'
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleShareDevice(device)}
                              className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                              title="Share Device"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleViewDetails(device)}
                              className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadDevice(device)}
                              className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-500 transition-colors"
                              title="Download Data"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDevice(device)}
                              className="p-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                              title="Delete Device"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Share Device Dialog */}
      {shareDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-light dark:glass rounded-2xl p-6 border border-primary/30 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Share Device
            </h3>
            <p className="text-muted-foreground mb-4">
              Enter the phone number of the customer you want to share "{selectedDevice?.device_name}" with:
            </p>
            <input
              type="tel"
              value={sharePhoneNumber}
              onChange={(e) => setSharePhoneNumber(e.target.value)}
              placeholder="Enter phone number"
              className="w-full p-3 rounded-lg bg-background/50 border border-primary/30 focus:border-primary focus:outline-none mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShareDialogOpen(false);
                  setSharePhoneNumber('');
                  setSelectedDevice(null);
                }}
                className="px-4 py-2 rounded-lg bg-muted/20 hover:bg-muted/30 text-muted-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitShareDevice}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/80 text-primary-foreground transition-colors"
              >
                Share Device
              </button>
            </div>
          </div>
        </div>
      )}

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

export default Devices;
