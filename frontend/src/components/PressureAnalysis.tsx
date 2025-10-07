import { useState, useEffect } from 'react';
import { Activity, Loader2 } from 'lucide-react';
import { useRefreshTimer } from '@/contexts/RefreshTimerContext';
import { apiClient } from '@/lib/api';

interface PressureRegion {
  name: string;
  value: number;
  status: 'Normal' | 'High' | 'Low';
}

const defaultRegions: PressureRegion[] = [
  { name: 'North', value: 1180, status: 'Normal' },
  { name: 'South', value: 1220, status: 'High' },
  { name: 'East', value: 1150, status: 'Normal' },
  { name: 'West', value: 1200, status: 'Normal' },
];

export const PressureAnalysis = () => {
  const [regions, setRegions] = useState<PressureRegion[]>(defaultRegions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshTrigger } = useRefreshTimer();

  const fetchPressureData = async () => {
    setLoading(true);
    setError(null);
    try {
      // For now, use device ID 1 as default. In a real app, this would come from context or props
      const response = await apiClient.getPressureReadings(1);
      if (response.success && response.data) {
        // Transform the API data to match our region format
        // Group pressure readings by some criteria or use latest readings
        const latestReadings = response.data.slice(0, 4); // Take first 4 readings
        const transformedRegions = latestReadings.map((reading: any, index: number) => ({
          name: `Region ${index + 1}`,
          value: reading.pressure,
          status: (reading.pressure > 1500 ? 'High' : reading.pressure > 1000 ? 'Normal' : 'Low') as 'Normal' | 'High' | 'Low'
        }));
        setRegions(transformedRegions.length > 0 ? transformedRegions : defaultRegions);
      } else {
        setRegions(defaultRegions);
      }
    } catch (err) {
      console.error('Failed to fetch pressure data:', err);
      setError('Using default data - API unavailable');
      setRegions(defaultRegions);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when refresh is triggered
  useEffect(() => {
    fetchPressureData();
  }, [refreshTrigger]);
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-primary neon-glow-magenta" />
          <h3 className="text-lg font-semibold">Pressure Analysis</h3>
        </div>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
      </div>
      {error && (
        <div className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
          <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
          {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        {regions.map((region) => (
          <div
            key={region.name}
            className="p-4 rounded-lg glass-light dark:glass border border-primary/20 hover:border-primary/50 transition-all hover:scale-105"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">{region.name}</span>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  region.status === 'High'
                    ? 'bg-destructive/20 text-destructive'
                    : 'bg-primary/20 text-primary'
                }`}
              >
                {region.status}
              </span>
            </div>
            <div className="text-2xl font-bold text-primary">{region.value} PSI</div>
          </div>
        ))}
      </div>
    </div>
  );
};
