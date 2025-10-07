import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Send, Smartphone, User, Calendar, Loader2, QrCode, Info, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DeviceDetails } from '@/components/DeviceDetails';

interface ReceivedDevice {
  device_name: string;
  device_code: string;
  username: string;
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

export const ReceivedDevices: React.FC = () => {
  const [receivedDevices, setReceivedDevices] = useState<ReceivedDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeviceDetails, setShowDeviceDetails] = useState(false);
  const [deviceForDetails, setDeviceForDetails] = useState<Device | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchReceivedDevices();
  }, []);

  const fetchReceivedDevices = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/devices/received/${user?.id}`, {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (result.success && result.data) {
        setReceivedDevices(result.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch received devices",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching received devices:', error);
      toast({
        title: "Error",
        description: "Failed to fetch received devices",
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
      const response = await fetch(`http://localhost:3001/devices/${deviceCode}/qr`, {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

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
          description: "QR code downloaded successfully",
        });
      } else {
        throw new Error('Failed to download QR code');
      }
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast({
        title: "Error",
        description: "Failed to download QR code",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (receivedDevice: ReceivedDevice) => {
    // Create a Device object from ReceivedDevice data
    const deviceForDetails: Device = {
      id: 0, // Placeholder ID - DeviceDetails will fetch the actual device ID using device_code
      device_code: receivedDevice.device_code,
      device_name: receivedDevice.device_name,
      device_m2m_number: undefined,
      allocated_at: receivedDevice.shared_at,
      is_active: true
    };

    setDeviceForDetails(deviceForDetails);
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
            <Download className="h-5 w-5" />
            Received Devices
          </CardTitle>
          <CardDescription>Loading received devices...</CardDescription>
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
            <Download className="h-5 w-5" />
            Received Devices
          </CardTitle>
          <CardDescription>
            Devices shared with you by other customers ({receivedDevices.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {receivedDevices.length === 0 ? (
            <div className="text-center py-8">
              <Download className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">No devices received yet</p>
              <p className="text-sm text-muted-foreground">
                Other customers haven't shared any devices with you yet
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Device</TableHead>
                    <TableHead>Device Code</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Received Date</TableHead>
                    <TableHead>Access</TableHead>
                    <TableHead className="w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivedDevices.map((device, index) => (
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
                        <Badge variant="secondary">
                          Read Access
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
      {receivedDevices.length > 0 && (
        <Card className="glass-light dark:glass border border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg">Access Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <div className="text-2xl font-bold text-primary">{receivedDevices.length}</div>
                <div className="text-sm text-muted-foreground">Total Received</div>
              </div>
              <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                <div className="text-2xl font-bold text-blue-500">
                  {new Set(receivedDevices.map(d => d.username)).size}
                </div>
                <div className="text-sm text-muted-foreground">Unique Owners</div>
              </div>
              <div className="text-center p-4 bg-green-500/10 rounded-lg">
                <div className="text-2xl font-bold text-green-500">
                  {new Set(receivedDevices.map(d => d.device_code)).size}
                </div>
                <div className="text-sm text-muted-foreground">Unique Devices</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card className="glass-light dark:glass border border-primary/30">
        <CardHeader>
          <CardTitle className="text-lg">About Received Devices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Download className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium">Read Access</h4>
              <p className="text-sm text-muted-foreground">
                You have read-only access to these devices. You can view their data but cannot modify settings.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium">Owner Control</h4>
              <p className="text-sm text-muted-foreground">
                The device owner retains full control and can revoke access at any time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};