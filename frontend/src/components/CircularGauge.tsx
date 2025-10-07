import { useEffect, useState } from 'react';

interface CircularGaugeProps {
  value: number;
  maxValue: number;
  label: string;
  unit: string;
  color: 'cyan' | 'magenta' | 'orange';
}

export const CircularGauge = ({ value, maxValue, label, unit, color }: CircularGaugeProps) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const percentage = (value / maxValue) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorMap = {
    cyan: 'hsl(var(--neon-cyan))',
    magenta: 'hsl(var(--neon-magenta))',
    orange: 'hsl(var(--neon-orange))',
  };

  const glowClass = {
    cyan: 'neon-glow-cyan',
    magenta: 'neon-glow-magenta',
    orange: 'neon-glow-orange',
  };

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const stepValue = value / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setAnimatedValue(Math.min(currentStep * stepValue, value));
      if (currentStep >= steps) clearInterval(timer);
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r="45"
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="8"
            opacity="0.2"
          />
          {/* Animated arc */}
          <circle
            cx="80"
            cy="80"
            r="45"
            fill="none"
            stroke={colorMap[color]}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`transition-all duration-1000 ease-out ${glowClass[color]}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color: colorMap[color] }}>
            {Math.round(animatedValue)}
          </span>
          <span className="text-xs text-muted-foreground mt-1">{unit}</span>
        </div>
      </div>
      <h3 className="mt-4 text-sm font-medium text-foreground">{label}</h3>
    </div>
  );
};
