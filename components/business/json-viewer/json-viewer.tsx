"use client";

import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Copy,
  MoreHorizontal,
} from "lucide-react";
import { type MouseEvent, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type JsonViewerProps = {
  data: any;
  rootName?: string;
  defaultExpanded?: boolean;
  className?: string;
};

export function JsonViewer({
  data,
  rootName = "root",
  defaultExpanded = true,
  className,
}: JsonViewerProps) {
  return (
    <TooltipProvider>
      <div className={cn("font-mono text-sm", className)}>
        <JsonNode
          data={data}
          defaultExpanded={defaultExpanded}
          isRoot={true}
          name={rootName}
        />
      </div>
    </TooltipProvider>
  );
}

type JsonNodeProps = {
  name: string;
  data: any;
  isRoot?: boolean;
  defaultExpanded?: boolean;
  level?: number;
};

function JsonNode({
  name,
  data,
  isRoot = false,
  defaultExpanded = true,
  level = 0,
}: JsonNodeProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isCopied, setIsCopied] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const copyToClipboard = (e: MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const dataType =
    data === null ? "null" : Array.isArray(data) ? "array" : typeof data;
  const isExpandable =
    data !== null &&
    data !== undefined &&
    !(data instanceof Date) &&
    (dataType === "object" || dataType === "array");
  const itemCount =
    isExpandable && data !== null && data !== undefined
      ? Object.keys(data).length
      : 0;

  return (
    <div
      className={cn("group/object pl-4", level > 0 && "border-border border-l")}
    >
      {/** biome-ignore lint/a11y/useSemanticElements: <explanation> */}
      <div
        aria-expanded={isExpandable ? isExpanded : undefined}
        className={cn(
          "-ml-4 group/property flex cursor-pointer items-center gap-1 rounded px-1 py-1 hover:bg-muted/50",
          isRoot && "font-semibold text-primary"
        )}
        onClick={isExpandable ? handleToggle : undefined}
        onKeyDown={
          isExpandable
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleToggle();
                }
              }
            : undefined
        }
        role="button"
        tabIndex={isExpandable ? 0 : -1}
      >
        {isExpandable ? (
          <div className="flex h-4 w-4 items-center justify-center">
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        ) : (
          <div className="w-4" />
        )}

        <span className="text-primary">{name}</span>

        <span className="text-muted-foreground">
          {isExpandable ? (
            <>
              {dataType === "array" ? "[" : "{"}
              {!isExpanded && (
                <span className="text-muted-foreground">
                  {" "}
                  {itemCount} {itemCount === 1 ? "item" : "items"}{" "}
                  {dataType === "array" ? "]" : "}"}
                </span>
              )}
            </>
          ) : (
            ":"
          )}
        </span>

        {!isExpandable && <JsonValue data={data} />}

        {!isExpandable && <div className="w-3.5" />}

        <button
          className="ml-auto rounded p-1 opacity-0 hover:bg-muted group-hover/property:opacity-100"
          onClick={copyToClipboard}
          title="Copy to clipboard"
          type="button"
        >
          {isCopied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
      </div>

      {isExpandable && isExpanded && data !== null && data !== undefined && (
        <div className="pl-4">
          {Object.keys(data).map((key) => (
            <JsonNode
              data={data[key]}
              defaultExpanded={level < 1}
              key={key}
              level={level + 1}
              name={dataType === "array" ? `${key}` : key}
            />
          ))}
          <div className="py-1 pl-4 text-muted-foreground">
            {dataType === "array" ? "]" : "}"}
          </div>
        </div>
      )}
    </div>
  );
}

// Update the JsonValue function to make the entire row clickable with an expand icon
function JsonValue({ data }: { data: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const dataType = typeof data;
  const TEXT_LIMIT = 80; // Character limit before truncation

  if (data === null) {
    return <span className="text-rose-500">null</span>;
  }

  if (data === undefined) {
    return <span className="text-muted-foreground">undefined</span>;
  }

  if (data instanceof Date) {
    return <span className="text-purple-500">{data.toISOString()}</span>;
  }

  switch (dataType) {
    case "string":
      if (data.length > TEXT_LIMIT) {
        return (
          // biome-ignore lint/a11y/useSemanticElements: <explanation>
          <div
            aria-expanded={isExpanded}
            className="group relative flex flex-1 cursor-pointer items-center text-emerald-500"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }
            }}
            role="button"
            tabIndex={0}
          >
            {`"`}
            {isExpanded ? (
              <span className="inline-block max-w-full">{data}</span>
            ) : (
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <span className="inline-block max-w-full">
                    {data.substring(0, TEXT_LIMIT)}...
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  className="max-w-md break-words p-2 text-xs"
                  side="bottom"
                >
                  {data}
                </TooltipContent>
              </Tooltip>
            )}
            {`"`}
            <div className="-translate-y-1/2 absolute top-1/2 right-0 translate-x-[calc(100%+4px)] opacity-0 transition-opacity group-hover:opacity-100">
              {isExpanded ? (
                <ChevronUp className="h-3 w-3 text-muted-foreground" />
              ) : (
                <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
          </div>
        );
      }
      return <span className="text-emerald-500">{`"${data}"`}</span>;
    case "number":
      return <span className="text-amber-500">{data}</span>;
    case "boolean":
      return <span className="text-blue-500">{data.toString()}</span>;
    default:
      return <span>{String(data)}</span>;
  }
}
