import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Smartphone, QrCode, Plus, Loader2, Download, Edit2, Check, X, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Device {
  id: number;
  device_code: string;
  device_name: string;
  device_m2m_number?: string;
  assigned_to: string | null;
  assigned_user_name?: string;
  created_at: string;
  qr_code?: Buffer;
}

export const DeviceManagement: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deviceCount, setDeviceCount] = useState('');
  const [editingM2M, setEditingM2M] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<string, string>>({});
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchDevices();
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(qrCodeUrls).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [qrCodeUrls]);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getDevices();
      if (response.success && response.data) {
        const deviceData = response.data.map((d: any) => ({
          ...d,
          assigned_to: d.assigned_to ? String(d.assigned_to) : null
        }));
        setDevices(deviceData);
        
        // Fetch QR codes for all devices
        deviceData.forEach((device: Device) => {
          fetchQRCodeData(device.device_code);
        });
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

  const generateDevices = async () => {
    const count = parseInt(deviceCount);
    
    if (!count || count < 1 || count > 1000) {
      toast({
        title: "Invalid Input",
        description: "Please enter a number between 1 and 1000",
        variant: "destructive",
      });
      return;
    }

    try {
      setGenerating(true);
      const response = await apiClient.generateDevices(count);

      if (response.success) {
        toast({
          title: "Success",
          description: `Successfully generated ${count} devices`,
        });
        setDeviceCount('');
        fetchDevices(); // Refresh the device list
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to generate devices",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating devices:', error);
      toast({
        title: "Error",
        description: "Failed to generate devices",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      generateDevices();
    }
  };

  const getQRCodeUrl = (deviceCode: string) => {
    return `http://localhost:3001/devices/${deviceCode}/qr`;
  };

  const fetchQRCodeData = async (deviceCode: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3001/devices/${deviceCode}/qr`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const dataUrl = URL.createObjectURL(blob);
        setQrCodeUrls(prev => ({ ...prev, [deviceCode]: dataUrl }));
      }
    } catch (error) {
      console.error('Failed to fetch QR code:', error);
    }
  };

  const downloadQRCode = async (deviceCode: string) => {
    try {
      const response = await fetch(getQRCodeUrl(deviceCode), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `device-${deviceCode}-qr.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
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

  const handleEditM2M = (deviceId: number, currentValue: string) => {
    setEditingM2M(deviceId);
    setEditingValue(currentValue || '');
  };

  const handleSaveM2M = async (deviceCode: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3001/devices/${deviceCode}/m2m`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ m2m_number: editingValue })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "M2M number updated successfully"
        });
        setEditingM2M(null);
        setEditingValue('');
        fetchDevices(); // Refresh the list
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update M2M number');
      }
    } catch (error) {
      console.error('Error updating M2M number:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update M2M number",
        variant: "destructive"
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingM2M(null);
    setEditingValue('');
  };

  const handleDeleteDevice = async (deviceCode: string) => {
    if (!confirm('Are you sure you want to delete this device? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3001/devices/${deviceCode}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Device deleted successfully"
        });
        fetchDevices(); // Refresh the list
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete device');
      }
    } catch (error) {
      console.error('Error deleting device:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete device",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card className="glass-light dark:glass border border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Device Management
          </CardTitle>
          <CardDescription>Loading devices...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Device Generation Section */}
      <Card className="glass-light dark:glass border border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Generate Devices
          </CardTitle>
          <CardDescription>
            Generate multiple devices with unique codes and QR codes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1 max-w-xs">
              <label htmlFor="deviceCount" className="block text-sm font-medium mb-2">
                Number of Devices (1-1000)
              </label>
              <Input
                id="deviceCount"
                type="number"
                min="1"
                max="1000"
                value={deviceCount}
                onChange={(e) => setDeviceCount(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter number of devices"
                disabled={generating}
              />
            </div>
            <Button 
              onClick={generateDevices} 
              disabled={generating || !deviceCount}
              className="bg-primary hover:bg-primary/90"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Devices List */}
      <Card className="glass-light dark:glass border border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Device Management
          </CardTitle>
          <CardDescription>
            Manage all generated devices and their QR codes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <div className="text-center py-8">
              <Smartphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No devices found. Generate some devices to get started.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device Code</TableHead>
                    <TableHead>M2M Number</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>QR Code</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell className="font-mono font-medium">
                        {device.device_code}
                      </TableCell>
                      <TableCell>
                        {editingM2M === device.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="w-32"
                              placeholder="M2M Number"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSaveM2M(device.device_code)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-mono">
                              {device.device_m2m_number || 'Not set'}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditM2M(device.id, device.device_m2m_number || '')}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {device.assigned_to ? (
                          <Badge variant="secondary">{device.assigned_user_name || device.assigned_to}</Badge>
                        ) : (
                          <Badge variant="outline">Unassigned</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(device.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {qrCodeUrls[device.device_code] ? (
                            <img
                              src={qrCodeUrls[device.device_code]}
                              alt={`QR Code for ${device.device_code}`}
                              className="w-24 h-24 border rounded"
                            />
                          ) : (
                            <div className="w-24 h-24 border rounded flex items-center justify-center bg-muted">
                              <QrCode className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadQRCode(device.device_code)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download QR
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteDevice(device.device_code)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
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