"use client";

interface KPIGaugeProps {
  label: string;
  value: number; // 0-100
  color: string;
  size?: number;
}

export function KPIGauge({ label, value, color, size = 80 }: KPIGaugeProps) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const displayColor = value >= 70 ? "#10B981" : value >= 50 ? "#F59E0B" : "rgba(255,255,255,0.15)";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          {/* Background circle */}
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4} />
          {/* Progress circle */}
          <circle
            cx={size/2} cy={size/2} r={radius} fill="none"
            stroke={color || displayColor} strokeWidth={4}
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.32,0.72,0,1)" }}
          />
        </svg>
        {/* Center text */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: size * 0.22, fontWeight: 800, color: color || displayColor }}>
            {value}%
          </span>
        </div>
      </div>
      <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--text-secondary)", textAlign: "center", maxWidth: size + 20 }}>
        {label}
      </span>
    </div>
  );
}