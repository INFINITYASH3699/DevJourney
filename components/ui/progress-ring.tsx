// components/ui/progress-ring.tsx

'use client';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  color = '#3b82f6',
  label,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/30"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span 
            className="font-bold text-foreground"
            style={{ fontSize: size * 0.2 }}
          >
            {Math.round(progress)}%
          </span>
        </div>
      </div>
      {label && (
        <span 
          className="text-muted-foreground font-medium text-center truncate max-w-full"
          style={{ fontSize: Math.max(size * 0.12, 10) }}
        >
          {label}
        </span>
      )}
    </div>
  );
}