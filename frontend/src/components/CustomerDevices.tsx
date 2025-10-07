import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Smartphone, Share2, QrCode, Calendar, User, Loader2, Activity, Download, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DeviceDetails } from '@/components/DeviceDetails';

interface Device {
  id: number;
  device_code: string;
  device_name: string;
  device_m2m_number?: string;
  allocated_at: string;
  is_active: boolean;
  qr_code?: Buffer;
}

export const CustomerDevices: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [showDeviceDetails, setShowDeviceDetails] = useState(false);
  const [deviceForDetails, setDeviceForDetails] = useState<Device | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching devices for user:', user?.id, user?.name);
      const response = await fetch(`http://localhost:3001/devices/owned/${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const result = await response.json();
      console.log('📱 API Response:', result);
      if (result.success && result.data) {
        console.log('✅ Setting devices:', result.data.length, 'devices');
        setDevices(result.data);
      } else {
        console.log('❌ API Error:', result.message);
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

  const shareDevice = async () => {
    if (!selectedDevice || !phoneNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a phone number to share with",
        variant: "destructive",
      });
      return;
    }

    // Basic phone number validation
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(phoneNumber.trim())) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    try {
      setSharing(true);
      const response = await fetch('http://localhost:3001/devices/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          deviceId: selectedDevice.id,
          recipientPhone: phoneNumber.trim()
        })
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: "Success",
          description: "Device shared successfully!",
        });
        setShareDialogOpen(false);
        setSelectedDevice(null);
        setPhoneNumber('');
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to share device",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Share device error:', error);
      toast({
        title: "Error",
        description: "Failed to share device",
        variant: "destructive",
      });
    } finally {
      setSharing(false);
    }
  };

  const getQRCodeUrl = (deviceCode: string) => {
    return `http://localhost:3001/devices/${deviceCode}/qr`;
  };

  const downloadQRCode = async (deviceCode: string) => {
    try {
      const response = await fetch(`http://localhost:3001/devices/${deviceCode}/qr`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${deviceCode}-qr.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Success",
          description: "QR code downloaded successfully!",
        });
      } else {
        throw new Error('Failed to download QR code');
      }
    } catch (error) {
      console.error('Download QR error:', error);
      toast({
        title: "Error",
        description: "Failed to download QR code",
        variant: "destructive",
      });
    }
  };

  const deleteDevice = async (deviceId: number, deviceName: string) => {
    if (!confirm(`Are you sure you want to delete "${deviceName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3001/devices/${deviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: "Success",
          description: "Device deleted successfully!",
        });
        fetchDevices(); // Refresh the device list
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete device",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Delete device error:', error);
      toast({
        title: "Error",
        description: "Failed to delete device",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeviceClick = (device: Device) => {
    setDeviceForDetails(device);
    setShowDeviceDetails(true);
  };

  const handleBackToDevices = () => {
    setShowDeviceDetails(false);
    setDeviceForDetails(null);
  };

  if (loading) {
    return (
      <Card className="glass-light dark:glass border border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            My Devices
          </CardTitle>
          <CardDescription>Loading your devices...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show device details if a device is selected
  if (showDeviceDetails && deviceForDetails) {
    return (
      <DeviceDetails 
        device={deviceForDetails} 
        onBack={handleBackToDevices}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-light dark:glass border border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            My Devices
          </CardTitle>
          <CardDescription>
            Devices assigned to your account ({devices.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <div className="text-center py-8">
              <Smartphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">No devices found</p>
              <p className="text-sm text-muted-foreground">
                Add your first device using the "Add Devices" section
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device ID</TableHead>
                    <TableHead>Device Name</TableHead>
                    <TableHead>Device Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Added Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell className="font-mono font-medium">
                        {device.id}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{device.device_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {device.device_code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant={device.is_active ? "default" : "secondary"}>
                          {device.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{formatDate(device.allocated_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog open={shareDialogOpen && selectedDevice?.id === device.id} onOpenChange={(open) => {
                            setShareDialogOpen(open);
                            if (!open) {
                              setSelectedDevice(null);
                              setPhoneNumber('');
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDevice(device);
                                }}
                              >
                                <Share2 className="h-4 w-4 mr-1" />
                                Share
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Share Device</DialogTitle>
                                <DialogDescription>
                                  Share "{device.device_name}" with another customer
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Phone Number</label>
                                  <Input
                                    type="tel"
                                    placeholder="Enter phone number (e.g., +1234567890)"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="w-full"
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    Enter the phone number of the customer you want to share this device with
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => setShareDialogOpen(false)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    className="flex-1"
                                    onClick={shareDevice}
                                    disabled={sharing || !phoneNumber.trim()}
                                  >
                                    {sharing ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Sharing...
                                      </>
                                    ) : (
                                      <>
                                        <Share2 className="h-4 w-4 mr-2" />
                                        Share Device
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadQRCode(device.device_code)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            QR
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteDevice(device.id, device.device_name)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                          
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeviceClick(device);
                            }}
                          >
                            <Activity className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};