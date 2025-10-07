import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import GaugeChart from 'react-gauge-chart';
import { ArrowLeft, Smartphone, Calendar, Activity, Thermometer, Ruler, Gauge, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Device {
  id: number;
  device_code: string;
  device_name: string;
  device_m2m_number?: string;
  allocated_at: string;
  is_active: boolean;

}

interface PressureReading {
  pressure1: number;
  pressure2: number;
  recorded_at: string;
}

interface TemperatureReading {
  temperature: number;
  recorded_at: string;
}

interface DistanceReading {
  distance: number;
  recorded_at: string;
}

interface LatestReadings {
  pressure?: PressureReading;
  temperature?: TemperatureReading;
  distance?: DistanceReading;
}

interface DeviceDetailsProps {
  device: Device;
  onBack: () => void;
}

export const DeviceDetails: React.FC<DeviceDetailsProps> = ({ device, onBack }) => {
  const [pressureReadings, setPressureReadings] = useState<PressureReading[]>([]);
  const [temperatureReadings, setTemperatureReadings] = useState<TemperatureReading[]>([]);
  const [distanceReadings, setDistanceReadings] = useState<DistanceReading[]>([]);
  const [latestReadings, setLatestReadings] = useState<LatestReadings>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actualDeviceId, setActualDeviceId] = useState<number | null>(null);
  const { toast } = useToast();

  // Fetch device by device code to get the actual device ID
  const fetchDeviceByCode = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`http://localhost:3001/devices/${device.device_code}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.device) {
        setActualDeviceId(result.device.id);
        return result.device.id;
      }
      throw new Error('Device not found');
    } catch (error) {
      console.error('Error fetching device by code:', error);
      setError('Failed to load device information');
      return null;
    }
  }, [device.device_code]);

  // Fetch latest readings only (for frequent updates)
  const fetchLatestReadings = useCallback(async () => {
    if (!actualDeviceId) return;
    
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`http://localhost:3001/devices/${actualDeviceId}/latest-readings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 429) {
        console.warn('Rate limit reached for latest readings');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setLatestReadings(result.data || {});
        setError(null);
      }
    } catch (error) {
      console.error('Error fetching latest readings:', error);
      // Don't show toast for rate limit errors to avoid spam
      if (!error.message.includes('429')) {
        setError('Failed to load latest readings');
      }
    }
  }, [actualDeviceId]);

  // Fetch historical data (less frequent)
  const fetchHistoricalData = useCallback(async () => {
    if (!actualDeviceId) return;
    
    try {
      setError(null);
      const token = localStorage.getItem('authToken');
      
      const promises = [
        fetch(`http://localhost:3001/devices/${actualDeviceId}/pressure`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:3001/devices/${actualDeviceId}/temperature`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:3001/devices/${actualDeviceId}/distance`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ];

      const responses = await Promise.all(promises);
      
      // Check for rate limiting
      const rateLimited = responses.some(res => res.status === 429);
      if (rateLimited) {
        console.warn('Rate limit reached for historical data');
        return;
      }

      const dataResults = await Promise.all(responses.map(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      }));

      // Process results
      const [pressureData, temperatureData, distanceData] = dataResults;
      
      if (pressureData.success) {
        setPressureReadings(pressureData.data || []);
      }
      if (temperatureData.success) {
        setTemperatureReadings(temperatureData.data || []);
      }
      if (distanceData.success) {
        setDistanceReadings(distanceData.data || []);
      }

    } catch (error) {
      console.error('Error fetching historical data:', error);
      setError('Failed to load historical data');
      toast({
        title: "Error",
        description: "Failed to load historical data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [actualDeviceId, toast]);

  // Combined initial fetch
  const fetchTelemetryData = useCallback(async () => {
    await Promise.all([fetchLatestReadings(), fetchHistoricalData()]);
  }, [fetchLatestReadings, fetchHistoricalData]);

  // Initial fetch: first get device ID, then fetch telemetry data
  useEffect(() => {
    const initializeData = async () => {
      const deviceId = await fetchDeviceByCode();
      if (deviceId) {
        // The actualDeviceId state will be set by fetchDeviceByCode
        // and the other functions will be triggered by their useEffect dependencies
      }
    };
    
    initializeData();
  }, [fetchDeviceByCode]);

  // Fetch telemetry data when actualDeviceId becomes available
  useEffect(() => {
    if (actualDeviceId) {
      fetchTelemetryData();
    }
  }, [actualDeviceId, fetchTelemetryData]);

  // Auto-refresh latest readings every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLatestReadings();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchLatestReadings]);

  // Auto-refresh historical data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchHistoricalData();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchHistoricalData]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatChartData = (readings: any[], valueKey: string) => {
    return readings.slice(0, 50).reverse().map((reading, index) => ({
      time: new Date(reading.recorded_at).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      value: reading[valueKey],
      fullTime: reading.recorded_at
    }));
  };

  const getPressureGaugeValue = (pressure: number | undefined) => {
    if (pressure === undefined || pressure === null) return 0;
    // Normalize pressure to 0-1 range (assuming max 200 kPa)
    return Math.min(pressure / 200, 1);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Devices
          </Button>
          <h1 className="text-2xl font-bold">Loading Device Details...</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Devices
        </Button>
        <h1 className="text-2xl font-bold">Device Details</h1>
      </div>

      {/* Error Banner */}
      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-destructive">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchTelemetryData}
                className="ml-auto"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Device Info Card */}
      <Card className="glass-light dark:glass border border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            {device.device_name}
          </CardTitle>
          <CardDescription>Device Information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Device Code</p>
              <p className="font-mono text-sm bg-muted px-2 py-1 rounded">{device.device_code}</p>
            </div>
            {device.device_m2m_number && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">M2M Number</p>
                <p className="font-mono text-sm">{device.device_m2m_number}</p>
              </div>
            )}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant={device.is_active ? "default" : "secondary"}>
                {device.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Allocated Date</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{formatDate(device.allocated_at)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pressure Gauges */}
      <div>
        <Card className="glass-light dark:glass border border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Pressure Readings
            </CardTitle>
            <CardDescription>Current pressure values (kPa)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">Pressure 1</h3>
                {latestReadings.pressure ? (
                  <>
                    <div className="w-48 h-48 mx-auto">
                      <GaugeChart
                        id="pressure1-gauge"
                        nrOfLevels={20}
                        colors={["#FF5F6D", "#FFC371", "#4ECDC4"]}
                        arcWidth={0.3}
                        percent={getPressureGaugeValue(latestReadings.pressure.pressure1)}
                        textColor="#374151"
                        needleColor="#374151"
                        needleBaseColor="#374151"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">{latestReadings.pressure.pressure1?.toFixed(2)} kPa</p>
                      <p className="text-sm text-muted-foreground">
                        Last updated: {new Date(latestReadings.pressure.recorded_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <Activity className="h-12 w-12 mb-2" />
                    <p>No Data Available</p>
                  </div>
                )}
              </div>

              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">Pressure 2</h3>
                {latestReadings.pressure ? (
                  <>
                    <div className="w-48 h-48 mx-auto">
                      <GaugeChart
                        id="pressure2-gauge"
                        nrOfLevels={20}
                        colors={["#FF5F6D", "#FFC371", "#4ECDC4"]}
                        arcWidth={0.3}
                        percent={getPressureGaugeValue(latestReadings.pressure.pressure2)}
                        textColor="#374151"
                        needleColor="#374151"
                        needleBaseColor="#374151"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">{latestReadings.pressure.pressure2?.toFixed(2)} kPa</p>
                      <p className="text-sm text-muted-foreground">
                        Last updated: {new Date(latestReadings.pressure.recorded_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <Activity className="h-12 w-12 mb-2" />
                    <p>No Data Available</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Temperature Chart */}
      <div>
        <Card className="glass-light dark:glass border border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              Temperature Readings
            </CardTitle>
            <CardDescription>Temperature over time (°C)</CardDescription>
          </CardHeader>
          <CardContent>
            {temperatureReadings.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formatChartData(temperatureReadings, 'temperature')}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(label) => `Time: ${label}`}
                      formatter={(value: number) => [`${value.toFixed(2)}°C`, 'Temperature']}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                      name="Temperature (°C)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-80 text-muted-foreground">
                <Thermometer className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">No Temperature Data</p>
                <p className="text-sm">Temperature readings will appear here once available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Distance Chart */}
      <div>
        <Card className="glass-light dark:glass border border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Distance Readings
            </CardTitle>
            <CardDescription>Distance measurements over time (cm)</CardDescription>
          </CardHeader>
          <CardContent>
            {distanceReadings.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formatChartData(distanceReadings, 'distance')}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(label) => `Time: ${label}`}
                      formatter={(value: number) => [`${value.toFixed(2)} cm`, 'Distance']}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      dot={{ fill: '#82ca9d', strokeWidth: 2, r: 4 }}
                      name="Distance (cm)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-80 text-muted-foreground">
                <Ruler className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">No Distance Data</p>
                <p className="text-sm">Distance readings will appear here once available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};