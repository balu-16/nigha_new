import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Send, Smartphone, User, Calendar, Loader2, QrCode, Info, Download, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DeviceDetails } from '@/components/DeviceDetails';
import { apiClient } from '@/lib/api';

interface SentDevice {
  device_name: string;
  device_code: string;
  username: string;
  user_id: number;
  shared_at: string;
}

interface Device {
  id: number;
  device_code: string;
  device_name: string;
  device_m2m_number?: string;
  allocated_at: string;
  is_active: boolean;
}

export const SentDevices: React.FC = () => {
  const [sentDevices, setSentDevices] = useState<SentDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeviceDetails, setShowDeviceDetails] = useState(false);
  const [deviceForDetails, setDeviceForDetails] = useState<Device | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchSentDevices();
  }, []);

  const fetchSentDevices = async () => {
    try {
      setLoading(true);
      if (!user?.id) {
        throw new Error('User ID not available');
      }
      
      const result = await apiClient.getSentDevices(user.id);
      if (result.success && result.data) {
        setSentDevices(result.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch sent devices",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching sent devices:', error);
      toast({
        title: "Error",
        description: "Failed to fetch sent devices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  const handleDownloadQR = async (deviceCode: string) => {
    try {
      const blob = await apiClient.downloadQR(deviceCode);
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
        description: "QR code downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast({
        title: "Error",
        description: "Failed to download QR code",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (sentDevice: SentDevice) => {
    // Create a Device object from SentDevice data
    const deviceForDetails: Device = {
      id: 0, // Placeholder ID - DeviceDetails will fetch the actual device ID using device_code
      device_code: sentDevice.device_code,
      device_name: sentDevice.device_name,
      device_m2m_number: undefined,
      allocated_at: sentDevice.shared_at,
      is_active: true
    };

    setDeviceForDetails(deviceForDetails);
    setShowDeviceDetails(true);
  };

  const handleBackToDevices = () => {
    setShowDeviceDetails(false);
    setDeviceForDetails(null);
  };

  const handleRevokeAccess = async (deviceCode: string, userId: number) => {
    try {
      const result = await apiClient.revokeAccess(deviceCode, userId);

      if (result.success) {
        toast({
          title: "Access Revoked",
          description: result.message,
        });
        // Refresh the sent devices list
        fetchSentDevices();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to revoke access",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error revoking access:', error);
      toast({
        title: "Error",
        description: "Failed to revoke access",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="glass-light dark:glass border border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Sent Devices
          </CardTitle>
          <CardDescription>Loading sent devices...</CardDescription>
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
            <Send className="h-5 w-5" />
            Sent Devices
          </CardTitle>
          <CardDescription>
            Devices you have shared with other customers ({sentDevices.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sentDevices.length === 0 ? (
            <div className="text-center py-8">
              <Send className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">No devices shared yet</p>
              <p className="text-sm text-muted-foreground">
                Share devices with other customers from your "My Devices" section
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Device</TableHead>
                    <TableHead>Device Code</TableHead>
                    <TableHead>Shared With</TableHead>
                    <TableHead>Shared Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sentDevices.map((device, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{device.device_name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {device.device_code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{device.username}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{formatDate(device.shared_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">
                          Shared
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadQR(device.device_code)}
                          >
                            <QrCode className="h-4 w-4 mr-1" />
                            QR
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(device)}
                          >
                            <Info className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevokeAccess(device.device_code, device.user_id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Revoke
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

      {/* Summary Card */}
      {sentDevices.length > 0 && (
        <Card className="glass-light dark:glass border border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg">Sharing Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <div className="text-2xl font-bold text-primary">{sentDevices.length}</div>
                <div className="text-sm text-muted-foreground">Total Shared</div>
              </div>
              <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                <div className="text-2xl font-bold text-blue-500">
                  {new Set(sentDevices.map(d => d.username)).size}
                </div>
                <div className="text-sm text-muted-foreground">Unique Recipients</div>
              </div>
              <div className="text-center p-4 bg-green-500/10 rounded-lg">
                <div className="text-2xl font-bold text-green-500">
                  {new Set(sentDevices.map(d => d.device_code)).size}
                </div>
                <div className="text-sm text-muted-foreground">Unique Devices</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};