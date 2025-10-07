import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScannerState } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QrCode, Camera, CameraOff, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const AddDevices: React.FC = () => {
  const [deviceCode, setDeviceCode] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const { toast } = useToast();

  const qrCodeRegionId = "qr-reader";

  useEffect(() => {
    return () => {
      // Cleanup scanner on component unmount
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  const startScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
    }

    const scanner = new Html5QrcodeScanner(
      qrCodeRegionId,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    );

    scanner.render(
      (decodedText) => {
        // QR code successfully scanned
        console.log('QR Code scanned:', decodedText);
        
        // Extract device code from QR data
        const deviceCodeMatch = decodedText.match(/\d{16}/);
        if (deviceCodeMatch) {
          setDeviceCode(deviceCodeMatch[0]);
          stopScanner();
        } else {
          toast({
            title: "Invalid QR Code",
            description: "QR code does not contain a valid 16-digit device code",
            variant: "destructive",
          });
        }
      },
      (error) => {
        // QR code scan error
        console.log('QR scan error:', error);
      }
    );

    scannerRef.current = scanner;
    setIsScanning(true);
    setScannerActive(true);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
    setIsScanning(false);
    setScannerActive(false);
  };

  const assignDevice = async () => {
    console.log('🔄 assignDevice called with deviceCode:', deviceCode);
    console.log('🔄 deviceName:', deviceName);
    
    if (!deviceCode) {
      console.log('❌ No device code provided');
      toast({
        title: "Error",
        description: "Device code is required",
        variant: "destructive",
      });
      return;
    }

    if (!/^\d{16}$/.test(deviceCode)) {
      console.log('❌ Invalid device code format:', deviceCode);
      toast({
        title: "Invalid Device Code",
        description: "Device code must be exactly 16 digits",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('📡 Making API call to assign device:', deviceCode);
      const authToken = localStorage.getItem('authToken');
      console.log('🔑 Auth token:', authToken ? `Present (${authToken.substring(0, 20)}...)` : 'Missing');
      
      const requestBody = {
        device_code: deviceCode,
        device_name: deviceName || `Device ${deviceCode}`
      };
      console.log('📦 Request body:', requestBody);
      
      setIsAssigning(true);
      
      const response = await fetch('http://localhost:3001/devices/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      const result = await response.json();
      console.log('📨 API Response:', result);

      if (result.success) {
        console.log('✅ Device assigned successfully');
        toast({
          title: "Success",
          description: "Device assigned successfully!",
        });
        
        // Reset form
        setDeviceCode('');
        setDeviceName('');
      } else {
        console.log('❌ Assignment failed:', result.message);
        toast({
          title: "Error",
          description: result.message || "Failed to assign device",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Assign device error:', error);
      toast({
        title: "Error",
        description: "Failed to assign device",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-light dark:glass border border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Device
          </CardTitle>
          <CardDescription>
            Scan QR codes to assign devices to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Click the button below to start scanning QR codes
                </p>
                
                {!scannerActive ? (
                  <Button 
                    onClick={startScanner}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Start QR Scanner
                  </Button>
                ) : (
                  <Button 
                    onClick={stopScanner}
                    variant="outline"
                    className="border-red-500 text-red-500 hover:bg-red-50"
                  >
                    <CameraOff className="h-4 w-4 mr-2" />
                    Stop Scanner
                  </Button>
                )}
              </div>

              <div id={qrCodeRegionId} className="w-1/3 mx-auto"></div>

              {deviceCode && (
                <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-center">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">
                      Scanned Device Code: {deviceCode}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="device-name">Device Name (Optional)</Label>
                    <Input
                      id="device-name"
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                      placeholder="Enter a custom name for this device"
                    />
                  </div>

                  <Button 
                    onClick={assignDevice}
                    disabled={isAssigning}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {isAssigning ? 'Assigning...' : 'Assign Device'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card className="glass-light dark:glass border border-primary/30">
        <CardHeader>
          <CardTitle className="text-lg">How to Add Devices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3">
            <QrCode className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium">QR Scanner</h4>
              <p className="text-sm text-muted-foreground">
                Use your camera to scan the QR code on your device. The device code will be automatically detected and assigned to your account.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};