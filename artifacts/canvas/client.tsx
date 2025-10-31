import { toast } from "sonner";
import { Artifact } from "@/components/create-artifact";
import { DocumentSkeleton } from "@/components/document-skeleton";
import {
  CopyIcon,
  RedoIcon,
  UndoIcon,
  BarChartIcon,
  MessageIcon,
} from "@/components/icons";

type ChartData = {
  type: "bar" | "line" | "pie";
  title?: string;
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  width?: number;
  height?: number;
};

type Metadata = {
  chartData: ChartData | null;
};

const BarChart = ({ data, title, height = 300 }: ChartData) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const chartHeight = height - 60; // Reserve space for labels
  
  return (
    <div className="rounded-lg border bg-white p-4">
      {title && <h3 className="mb-4 text-center font-semibold text-lg">{title}</h3>}
      <div className="flex items-end justify-center gap-2" style={{ height: chartHeight }}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * (chartHeight - 40);
          const color = item.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)`;
          
          return (
            <div key={`bar-${item.label}-${index}`} className="flex flex-col items-center gap-1">
              <div className="font-medium text-xs">{item.value}</div>
              <div
                className="rounded-t-sm transition-all duration-300 hover:opacity-80"
                style={{
                  backgroundColor: color,
                  height: `${barHeight}px`,
                  minHeight: "4px",
                  width: "40px"
                }}
              />
              <div className="max-w-[60px] break-words text-center text-xs">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const LineChart = ({ data, title, width = 400, height = 300 }: ChartData) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const chartHeight = height - 80;
  const chartWidth = width - 80;
  
  return (
    <div className="rounded-lg border bg-white p-4">
      {title && <h3 className="mb-4 text-center font-semibold text-lg">{title}</h3>}
      <div className="relative" style={{ width: chartWidth + 40, height: chartHeight + 40 }}>
        {/* Y-axis */}
        <div className="absolute top-0 left-0 flex h-full w-8 flex-col justify-between text-xs">
          <span>{maxValue}</span>
          <span>{Math.round((maxValue + minValue) / 2)}</span>
          <span>{minValue}</span>
        </div>
        
        {/* Chart area */}
        <div className="absolute top-0 left-8 border-gray-300 border-b border-l" 
             style={{ height: chartHeight, width: chartWidth }}>
          {/* Data points and lines */}
          <div className="relative h-full w-full">
            {data.map((item, index) => {
              const x = (index / (data.length - 1)) * (chartWidth - 20) + 10;
              const y = chartHeight - ((item.value - minValue) / (maxValue - minValue)) * (chartHeight - 20) - 10;
              
              return (
                <div key={`line-${item.label}-${index}`}>
                  {/* Data point */}
                  <div
                    className="-translate-x-1 -translate-y-1 absolute h-2 w-2 transform rounded-full bg-blue-500"
                    style={{ left: x, top: y }}
                    title={`${item.label}: ${item.value}`}
                  />
                  
                  {/* Line to next point */}
                  {index < data.length - 1 && (
                    <div
                      className="absolute bg-blue-500"
                      style={{
                        height: "2px",
                        left: x,
                        top: y,
                        transform: `rotate(${Math.atan2(
                          chartHeight - ((data[index + 1].value - minValue) / (maxValue - minValue)) * (chartHeight - 20) - 10 - y,
                          (index + 1) / (data.length - 1) * (chartWidth - 20) + 10 - x
                        )}rad)`,
                        transformOrigin: "left center",
                        width: Math.sqrt(
                          ((index + 1) / (data.length - 1) * (chartWidth - 20) + 10 - x) ** 2 +
                          (chartHeight - ((data[index + 1].value - minValue) / (maxValue - minValue)) * (chartHeight - 20) - 10 - y) ** 2
                        )
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* X-axis labels */}
        <div className="absolute left-8 flex justify-between text-xs" 
             style={{ top: chartHeight + 8, width: chartWidth }}>
          {data.map((item, index) => (
            <span key={`label-${item.label}-${index}`} className="-rotate-45 origin-left transform">
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const PieChart = ({ data, title, width = 400, height = 300 }: ChartData) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = Math.min(width, height) / 3;
  const centerX = width / 2;
  const centerY = height / 2;
  
  let currentAngle = 0;
  
  return (
    <div className="rounded-lg border bg-white p-4">
      {title && <h3 className="mb-4 text-center font-semibold text-lg">{title}</h3>}
      <div className="flex items-center justify-center">
        <div className="relative" style={{ width, height }}>
          {/* Pie slices */}
          {data.map((item, index) => {
            const sliceAngle = (item.value / total) * 360;
            const color = item.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)`;
            
            // Create pie slice using CSS clip-path approximation with divs
            const startAngle = currentAngle;
            const endAngle = currentAngle + sliceAngle;
            currentAngle += sliceAngle;
            
            return (
              <div key={`pie-${item.label}-${index}`}>
                {/* Pie slice representation using positioned div */}
                <div
                  className="absolute rounded-full"
                  style={{
                    backgroundColor: color,
                    clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((startAngle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((startAngle - 90) * Math.PI / 180)}%, ${50 + 50 * Math.cos((endAngle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((endAngle - 90) * Math.PI / 180)}%)`,
                    height: radius * 2,
                    left: centerX - radius,
                    top: centerY - radius,
                    width: radius * 2
                  }}
                />
                
                {/* Label */}
                <div
                  className="absolute text-center font-medium text-xs"
                  style={{
                    left: centerX + (radius * 0.7) * Math.cos((startAngle + sliceAngle / 2 - 90) * Math.PI / 180) - 20,
                    top: centerY + (radius * 0.7) * Math.sin((startAngle + sliceAngle / 2 - 90) * Math.PI / 180) - 10,
                    width: "40px"
                  }}
                >
                  {Math.round((item.value / total) * 100)}%
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="ml-8 space-y-2">
          {data.map((item, index) => {
            const color = item.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)`;
            return (
              <div key={`legend-${item.label}-${index}`} className="flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm">{item.label}: {item.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const ChartRenderer = ({ content }: { content: string }) => {
  try {
    const chartData: ChartData = JSON.parse(content);
    
    if (!chartData.data || !Array.isArray(chartData.data)) {
      return (
        <div className="p-8 text-center text-gray-500">
          Invalid chart data format. Expected JSON with 'data' array.
        </div>
      );
    }
    
    switch (chartData.type) {
      case "bar":
        return <BarChart {...chartData} />;
      case "line":
        return <LineChart {...chartData} />;
      case "pie":
        return <PieChart {...chartData} />;
      default:
        return (
          <div className="p-8 text-center text-gray-500">
            Unsupported chart type: {chartData.type}. Supported types: bar, line, pie.
          </div>
        );
    }
  } catch (error) {
    return (
      <div className="p-8 text-center text-red-500">
        Error parsing chart data: {error instanceof Error ? error.message : "Invalid JSON"}
      </div>
    );
  }
};

export const canvasArtifact = new Artifact<"canvas", Metadata>({
  kind: "canvas",
  description: "Useful for creating basic charts and data visualizations using JSON data",
  initialize: ({ setMetadata }) => {
    setMetadata({
      chartData: null,
    });
  },
  onStreamPart: ({ streamPart, setArtifact }) => {
    if (streamPart.type === "data-canvasDelta") {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.data,
        isVisible: true,
        status: "streaming",
      }));
    }
  },
  content: ({ content, status }) => {
    if (status === "streaming" && !content) {
      return <DocumentSkeleton artifactKind="canvas" />;
    }
    
    return (
      <div className="h-full w-full overflow-auto">
        <ChartRenderer content={content} />
      </div>
    );
  },
  actions: [
    {
      icon: <UndoIcon size={18} />,
      description: "View Previous version",
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("prev");
      },
      isDisabled: ({ currentVersionIndex }) => {
        return currentVersionIndex === 0;
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: "View Next version",
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("next");
      },
      isDisabled: ({ isCurrentVersion }) => {
        return isCurrentVersion;
      },
    },
    {
      icon: <CopyIcon size={18} />,
      description: "Copy chart data to clipboard",
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content);
        toast.success("Chart data copied to clipboard!");
      },
    },
  ],
  toolbar: [
    {
      icon: <BarChartIcon />,
      description: "Modify chart",
      onClick: ({ sendMessage }) => {
        sendMessage({
          role: "user",
          parts: [
            {
              type: "text",
              text: "Please modify this chart based on my requirements",
            },
          ],
        });
      },
    },
    {
      icon: <MessageIcon />,
      description: "Add chart annotations",
      onClick: ({ sendMessage }) => {
        sendMessage({
          role: "user",
          parts: [
            {
              type: "text",
              text: "Please add annotations or improve the chart visualization",
            },
          ],
        });
      },
    },
  ],
});