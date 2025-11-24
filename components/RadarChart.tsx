import React from 'react';

interface RadarChartProps {
  metrics: {
    infoArchitecture: number;
    visualHierarchy: number;
    layoutSpacing: number;
    accessibility: number;
    usability: number;
  };
}

const RadarChart: React.FC<RadarChartProps> = ({ metrics }) => {
  const width = 300;
  const height = 260; 
  const centerX = width / 2;
  const centerY = height / 2 + 10;
  const radius = 80;
  const levels = 4;

  const data = [
    { key: 'Information Architecture', value: metrics.infoArchitecture },
    { key: 'Visual Hierarchy', value: metrics.visualHierarchy },
    { key: 'Layout & Spacing', value: metrics.layoutSpacing },
    { key: 'Accessibility', value: metrics.accessibility },
    { key: 'Usability', value: metrics.usability },
  ];

  const totalPoints = data.length;
  const angleSlice = (Math.PI * 2) / totalPoints;

  const getCoordinates = (factor: number, i: number) => {
    const angle = i * angleSlice - Math.PI / 2; 
    return {
      x: centerX + radius * factor * Math.cos(angle),
      y: centerY + radius * factor * Math.sin(angle),
    };
  };

  const levelPaths = Array.from({ length: levels }).map((_, levelIndex) => {
    const factor = (levelIndex + 1) / levels;
    const points = data.map((_, i) => {
      const { x, y } = getCoordinates(factor, i);
      return `${x},${y}`;
    });
    return points.join(' ');
  });

  const dataPoints = data.map((d, i) => {
    const factor = d.value / 10;
    const { x, y } = getCoordinates(factor, i);
    return `${x},${y}`;
  });
  const dataPathString = dataPoints.join(' ');

  return (
    <div className="flex flex-col items-center">
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Background Web */}
        {levelPaths.map((path, i) => (
          <polygon
            key={i}
            points={path}
            fill="none"
            className="stroke-slate-300 dark:stroke-slate-700 transition-colors"
            strokeWidth="1"
          />
        ))}

        {/* Axes Lines */}
        {data.map((_, i) => {
          const { x, y } = getCoordinates(1, i);
          return (
            <line
              key={i}
              x1={centerX}
              y1={centerY}
              x2={x}
              y2={y}
              className="stroke-slate-300 dark:stroke-slate-700 transition-colors"
              strokeWidth="1"
            />
          );
        })}

        {/* Data Shape */}
        <polygon
          points={dataPathString}
          className="fill-indigo-500/20 stroke-indigo-500 dark:fill-indigo-500/30 dark:stroke-indigo-400 transition-colors"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Labels */}
        {data.map((d, i) => {
          const { x, y } = getCoordinates(1.25, i);
          let textAnchor: 'start' | 'middle' | 'end' = 'middle';
          if (i === 1 || i === 2) textAnchor = 'start';
          if (i === 3 || i === 4) textAnchor = 'end';

          let yOffset = 0;
          if (i === 0) yOffset = -5;
          if (i === 2 || i === 3) yOffset = 5;

          return (
            <text
              key={i}
              x={x}
              y={y + yOffset}
              textAnchor={textAnchor}
              fontSize="11"
              className="font-medium fill-slate-500 dark:fill-slate-400 transition-colors"
              style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.05)' }}
            >
              {d.key}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

export default RadarChart;