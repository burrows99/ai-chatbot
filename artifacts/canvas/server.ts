import { generateObject } from "ai";
import { z } from "zod";
import { canvasPrompt, updateDocumentPrompt } from "@/lib/ai/prompts";
import { myProvider } from "@/lib/ai/providers";
import { createDocumentHandler } from "@/lib/artifacts/server";

const chartDataSchema = z.object({
  type: z.enum(["bar", "line", "pie"]),
  title: z.string().optional(),
  data: z.array(z.object({
    label: z.string(),
    value: z.number(),
    color: z.string().optional(),
  })),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const canvasDocumentHandler = createDocumentHandler({
  kind: "canvas",
  onCreateDocument: async ({ title, dataStream }) => {
    dataStream.write({
      type: "data-canvasDelta",
      data: "",
      transient: true,
    });

    const { object: chartData } = await generateObject({
      model: myProvider.languageModel("artifact-model"),
      schema: chartDataSchema,
      system: canvasPrompt,
      prompt: `Create a chart based on the title: "${title}". 
      
      Generate appropriate sample data that makes sense for the title. 
      Choose the most suitable chart type (bar, line, or pie) based on the data.
      Include 4-8 data points with meaningful labels and realistic values.
      
      For example:
      - If it's about sales data, use a bar chart with months and sales figures
      - If it's about trends over time, use a line chart
      - If it's about proportions or percentages, use a pie chart
      
      Make sure the data is realistic and the chart type fits the content.`,
    });

    const chartJson = JSON.stringify(chartData, null, 2);

    dataStream.write({
      type: "data-canvasDelta",
      data: chartJson,
      transient: true,
    });

    return chartJson;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let currentData: any;
    try {
      currentData = JSON.parse(document.content || "{}");
    } catch {
      currentData = {};
    }

    dataStream.write({
      type: "data-canvasDelta",
      data: document.content || "",
      transient: true,
    });

    const { object: updatedChartData } = await generateObject({
      model: myProvider.languageModel("artifact-model"),
      schema: chartDataSchema,
      system: updateDocumentPrompt(document.content, "canvas"),
      prompt: `Update the existing chart data based on this request: "${description}"
      
      Current chart data:
      ${JSON.stringify(currentData, null, 2)}
      
      Modify the chart according to the user's request. This could involve:
      - Changing the chart type (bar, line, pie)
      - Updating data values
      - Adding or removing data points
      - Changing labels or title
      - Adjusting colors
      
      Keep the changes focused on what the user requested while maintaining data integrity.`,
    });

    const updatedJson = JSON.stringify(updatedChartData, null, 2);

    dataStream.write({
      type: "data-canvasDelta",
      data: updatedJson,
      transient: true,
    });

    return updatedJson;
  },
});