import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '@/contexts/ThemeContext';
import { useRefreshTimer } from '@/contexts/RefreshTimerContext';
import { apiClient } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface TemperatureData {
  time: string;
  temp: number;
}

const defaultData: TemperatureData[] = [
  { time: '00:00', temp: 320 },
  { time: '04:00', temp: 325 },
  { time: '08:00', temp: 340 },
  { time: '12:00', temp: 350 },
  { time: '16:00', temp: 345 },
  { time: '20:00', temp: 335 },
  { time: '24:00', temp: 330 },
];

export const TemperatureChart = () => {
  const { theme } = useTheme();
  const { refreshTrigger } = useRefreshTimer();
  const [data, setData] = useState<TemperatureData[]>(defaultData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDark = theme === 'dark';

  const fetchTemperatureData = async () => {
    setLoading(true);
    setError(null);
    try {
      // For now, use device ID 1 as default. In a real app, this would come from context or props
      const response = await apiClient.getTemperatureReadings(1);
      if (response.success && response.data) {
        // Transform the API data to match our chart format
        const transformedData = response.data.slice(0, 10).map((reading: any, index: number) => ({
            time: new Date(reading.recorded_at).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            temp: reading.temperature
          })).reverse(); // Reverse to show chronological order
        setData(transformedData);
      } else {
        setData(defaultData);
      }
    } catch (err) {
      console.error('Failed to fetch temperature data:', err);
      setError('Using default data - API unavailable');
      setData(defaultData);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when refresh is triggered
  useEffect(() => {
    fetchTemperatureData();
  }, [refreshTrigger]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Temperature Monitor</h3>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
      </div>
      {error && (
        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
          <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
          {error}
        </div>
      )}
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <defs>
            <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isDark ? "hsl(var(--neon-orange))" : "hsl(16 100% 60%)"} stopOpacity={0.8} />
              <stop offset="100%" stopColor={isDark ? "hsl(var(--neon-orange))" : "hsl(45 100% 60%)"} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} />
          <XAxis dataKey="time" stroke={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"} />
          <YAxis stroke={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"} />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? 'hsl(var(--card))' : 'white',
              border: `1px solid ${isDark ? 'hsl(var(--border))' : '#e5e7eb'}`,
              borderRadius: '8px',
            }}
          />
          <Line
            type="monotone"
            dataKey="temp"
            stroke={isDark ? "hsl(var(--neon-orange))" : "hsl(16 100% 60%)"}
            strokeWidth={3}
            dot={{ fill: isDark ? "hsl(var(--neon-orange))" : "hsl(16 100% 60%)", r: 4 }}
            activeDot={{ r: 6 }}
            className={isDark ? "neon-glow-orange" : ""}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
