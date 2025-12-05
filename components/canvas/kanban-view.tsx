import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from "@/components/ui/shadcn-io/kanban";

export type KanbanColumn = {
  id: string;
  name: string;
  color: string;
};

export type KanbanFeature = {
  id: string;
  name: string;
  description?: string;
  priority?: string;
  startAt: Date;
  endAt: Date;
  column: string;
  owner: {
    id: string;
    name: string;
    image: string;
  };
  metadata?: Record<string, string>;
};

export type KanbanTransformedData = {
  columns: KanbanColumn[];
  features: KanbanFeature[];
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

type KanbanViewProps = {
  columns: Array<{ id: string; name: string; color: string }>;
  users: Array<{ id: string; name: string; image: string }>;
  features: Array<{
    id: string;
    name: string;
    description?: string;
    priority?: string;
    startAt: Date;
    endAt: Date;
    column: string;
    owner: { id: string; name: string; image: string };
    metadata?: Record<string, string>;
  }>;
};

const KanbanView = ({ columns, features }: KanbanViewProps) => {
  const [featuresState, setFeaturesState] = useState(features);
  return (
    <KanbanProvider
      columns={columns}
      data={featuresState}
      onDataChange={setFeaturesState}
    >
      {(column) => (
        <KanbanBoard id={column.id} key={column.id}>
          <KanbanHeader>
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: column.color }}
              />
              <span>{column.name}</span>
            </div>
          </KanbanHeader>
          <KanbanCards id={column.id}>
            {(feature: (typeof features)[number]) => (
              <KanbanCard
                column={column.id}
                id={feature.id}
                key={feature.id}
                name={feature.name}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <p className="m-0 font-medium text-sm">{feature.name}</p>
                      {feature.priority && (
                        <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-xs">
                          {feature.priority}
                        </span>
                      )}
                    </div>
                    {feature.description && (
                      <p className="m-0 line-clamp-2 text-muted-foreground text-xs">
                        {feature.description}
                      </p>
                    )}
                  </div>
                  {feature.owner && (
                    <Avatar className="h-4 w-4 shrink-0">
                      <AvatarImage src={feature.owner.image} />
                      <AvatarFallback>
                        {feature.owner.name?.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
                <p className="m-0 text-muted-foreground text-xs">
                  {shortDateFormatter.format(feature.startAt)} -{" "}
                  {dateFormatter.format(feature.endAt)}
                </p>
              </KanbanCard>
            )}
          </KanbanCards>
        </KanbanBoard>
      )}
    </KanbanProvider>
  );
};
export default KanbanView;
