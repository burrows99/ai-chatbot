/** biome-ignore-all lint/suspicious/noArrayIndexKey: false positive */
/** biome-ignore-all assist/source/useSortedAttributes: intentional attribute order */
"use client";

import { SearchIcon } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type CommandBarButton = {
  label: string;
  tooltip: string;
  callback: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
};

type CommandBarButtonGroup = CommandBarButton[];

type CommandBarProps = {
  buttonGroups: CommandBarButtonGroup[];
  className?: string;
  orientation?: "horizontal" | "vertical";
  size?: "default" | "sm" | "lg";
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
};

export function CommandBar({
  buttonGroups,
  className,
  orientation = "horizontal",
  size = "default",
  variant = "outline",
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  showSearch = false,
  ...props
}: CommandBarProps) {
  if (!buttonGroups || buttonGroups.length === 0) {
    return null;
  }

  const isHorizontal = orientation === "horizontal";

  return (
    <TooltipProvider>
      <div
        className={cn(
          "mb-3 flex w-full items-center gap-1 rounded-md border bg-background p-1 shadow-sm",
          isHorizontal ? "flex-row" : "flex-col",
          className
        )}
        {...props}
      >
        {/* Search Box */}
        {showSearch && onSearchChange && (
          <>
            <div className="min-w-0 flex-1">
              <InputGroup>
                <InputGroupInput
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <InputGroupAddon>
                  <SearchIcon className="h-4 w-4" />
                </InputGroupAddon>
              </InputGroup>
            </div>
            {buttonGroups.length > 0 && (
              <Separator
                orientation={isHorizontal ? "vertical" : "horizontal"}
                className={cn(
                  "bg-border",
                  isHorizontal ? "h-6 w-[1px]" : "h-[1px] w-6"
                )}
              />
            )}
          </>
        )}

        {buttonGroups.map((group, groupIndex) => (
          <React.Fragment key={groupIndex}>
            {/* Render separator before each group (except the first one, or if search is shown) */}
            {groupIndex > 0 && (
              <Separator
                orientation={isHorizontal ? "vertical" : "horizontal"}
                className={cn(
                  "bg-border",
                  isHorizontal ? "h-6 w-[1px]" : "h-[1px] w-6"
                )}
              />
            )}

            {/* Render buttons in the group */}
            <div
              className={cn(
                "flex gap-0.5",
                isHorizontal ? "flex-row" : "flex-col"
              )}
            >
              {group.map((button, buttonIndex) => (
                <Tooltip key={buttonIndex}>
                  <TooltipTrigger asChild>
                    <Button
                      // variant={button.variant || variant}
                      // size={button.size || size}
                      disabled={button.disabled}
                      onClick={button.callback}
                      className={cn(
                        "transition-all duration-200",
                        button.disabled && "cursor-not-allowed opacity-50"
                      )}
                    >
                      {button.icon && (
                        <span className="flex items-center justify-center">
                          {button.icon}
                        </span>
                      )}
                      {button.label}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{button.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </React.Fragment>
        ))}
      </div>
    </TooltipProvider>
  );
}

// Export types for external use
export type { CommandBarButton, CommandBarButtonGroup, CommandBarProps };
