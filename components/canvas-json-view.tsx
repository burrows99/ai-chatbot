import { memo } from "react";

type CanvasJsonViewProps = {
  content: string;
};

export const CanvasJsonView = memo(function CanvasJsonViewComponent({
  content,
}: CanvasJsonViewProps) {
  let parsedContent: any;
  let jsonString: string;

  try {
    parsedContent = JSON.parse(content);
    jsonString = JSON.stringify(parsedContent, null, 2);
  } catch (_error) {
    jsonString = content;
  }

  return (
    <div className="h-full w-full overflow-auto p-4">
      <pre className="rounded-lg bg-muted p-4 font-mono text-sm">
        <code>{jsonString}</code>
      </pre>
    </div>
  );
});
