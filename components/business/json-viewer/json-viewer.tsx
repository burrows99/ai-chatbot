const JsonViewer = ({ content }: { content: string }) => {
  try {
    const jsonData = JSON.parse(content);

    return (
      <div className="h-full w-full overflow-auto p-4">
        <div className="rounded-lg border bg-gray-50 p-4">
          <h3 className="mb-4 font-semibold text-gray-800 text-lg">
            Generated Canvas Data
          </h3>
          <pre className="overflow-auto rounded bg-white p-4 text-sm">
            <code className="text-gray-700">
              {JSON.stringify(jsonData, null, 2)}
            </code>
          </pre>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <h3 className="mb-2 font-semibold text-lg text-red-800">
            Invalid JSON
          </h3>
          <p className="text-red-600">
            Error parsing JSON data:{" "}
            {error instanceof Error ? error.message : "Invalid format"}
          </p>
          <div className="mt-4 rounded bg-red-100 p-3 text-left text-sm">
            <strong>Raw content:</strong>
            <pre className="mt-2 whitespace-pre-wrap break-words text-red-700">
              {content}
            </pre>
          </div>
        </div>
      </div>
    );
  }
};

export default JsonViewer;