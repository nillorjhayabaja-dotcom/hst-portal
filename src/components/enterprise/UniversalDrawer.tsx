// Universal Drawer - Reusable right-side drawer with tabs for every module
import { useState, type ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DrawerTab {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: number;
  content: ReactNode;
}

interface UniversalDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  tabs?: DrawerTab[];
  children?: ReactNode;
  className?: string;
  side?: "right" | "left";
  width?: string;
}

export function UniversalDrawer({
  open,
  onClose,
  title,
  description,
  tabs,
  children,
  className,
  side = "right",
  width = "sm:max-w-lg",
}: UniversalDrawerProps) {
  const [activeTab, setActiveTab] = useState(tabs?.[0]?.id ?? "");

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side={side}
        className={cn("w-full p-0", width, className)}
      >
        <SheetHeader className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <SheetTitle className="text-lg truncate">{title}</SheetTitle>
              {description && (
                <SheetDescription className="text-xs mt-0.5">
                  {description}
                </SheetDescription>
              )}
            </div>
            <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>
        </SheetHeader>

        {tabs ? (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-col h-[calc(100vh-73px)]"
          >
            <div className="border-b border-border px-6">
              <TabsList className="h-10 w-full justify-start gap-0 bg-transparent p-0">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={cn(
                      "relative rounded-none border-b-2 border-transparent px-4 py-2 text-xs font-medium transition-colors",
                      "data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none",
                      "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      {tab.icon}
                      {tab.label}
                      {tab.badge != null && tab.badge > 0 && (
                        <span className="grid size-4 place-items-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                          {tab.badge}
                        </span>
                      )}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <div className="flex-1 overflow-hidden">
              {tabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="h-full p-0 m-0">
                  <ScrollArea className="h-full">
                    <div className="px-6 py-4">{tab.content}</div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        ) : (
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="px-6 py-4">{children}</div>
            </ScrollArea>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}