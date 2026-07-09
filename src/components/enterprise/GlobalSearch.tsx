// Global Search - Enterprise Command Palette (Ctrl+K)
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Search, Clock, Hash, LayoutDashboard, FileText, User, Building2 } from "lucide-react";
import { searchEnterprise } from "@/services/search-service";
import { MOCK_RECENT_SEARCHES } from "@/mock/enterprise-data";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/types/enterprise";

const ICON_MAP: Record<string, typeof Search> = {
  LayoutDashboard,
  FileText,
  User,
  Building2,
  Hash,
  Search,
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (value.trim()) {
      setResults(searchEnterprise({ q: value, limit: 8 }));
    } else {
      setResults([]);
    }
  }, []);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setOpen(false);
      if (result.to) {
        navigate({ to: result.to });
      }
    },
    [navigate],
  );

  const getIcon = (iconName: string) => {
    const Icon = ICON_MAP[iconName] ?? Search;
    return <Icon className="size-4" />;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      module: "Module",
      employee: "Employee",
      request: "Request",
      department: "Department",
      "control-number": "CN",
    };
    return labels[type] ?? type;
  };

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Search anything...</span>
        <span className="hidden sm:inline">·</span>
        <kbd className="hidden rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
          Ctrl+K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search modules, employees, requests, departments..."
          value={query}
          onValueChange={handleSearch}
          ref={inputRef}
        />
        <CommandList>
          {query.trim() && results.length === 0 && (
            <CommandEmpty>
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Search className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No results found for "{query}"</p>
                <p className="text-xs text-muted-foreground/60">
                  Try searching for a module, employee, or control number
                </p>
              </div>
            </CommandEmpty>
          )}

          {!query.trim() && MOCK_RECENT_SEARCHES.length > 0 && (
            <>
              <CommandGroup heading="Recent Searches">
                {MOCK_RECENT_SEARCHES.map((term) => (
                  <CommandItem
                    key={term}
                    onSelect={() => handleSearch(term)}
                    className="flex items-center gap-2"
                  >
                    <Clock className="size-4 text-muted-foreground" />
                    <span>{term}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Quick Navigation">
                <CommandItem onSelect={() => { setOpen(false); navigate({ to: "/app/dashboard" }); }}>
                  <LayoutDashboard className="size-4" />
                  <span>Dashboard</span>
                </CommandItem>
                <CommandItem onSelect={() => { setOpen(false); navigate({ to: "/app/notifications" }); }}>
                  <FileText className="size-4" />
                  <span>Notifications</span>
                </CommandItem>
                <CommandItem onSelect={() => { setOpen(false); navigate({ to: "/app/profile" }); }}>
                  <User className="size-4" />
                  <span>My Profile</span>
                </CommandItem>
              </CommandGroup>
            </>
          )}

          {results.length > 0 && (
            <>
              {/* Group results by type */}
              {(["module", "request", "employee", "department", "control-number"] as const).map((type) => {
                const typeResults = results.filter((r) => r.type === type);
                if (typeResults.length === 0) return null;
                return (
                  <CommandGroup key={type} heading={getTypeLabel(type)}>
                    {typeResults.map((result) => (
                      <CommandItem
                        key={result.id}
                        onSelect={() => handleSelect(result)}
                        className="flex items-center gap-3"
                      >
                        <span className="grid size-7 place-items-center rounded-md bg-muted">
                          {getIcon(result.icon)}
                        </span>
                        <div className="flex flex-1 flex-col">
                          <span className="text-sm font-medium">{result.label}</span>
                          <span className="text-xs text-muted-foreground">{result.description}</span>
                        </div>
                        {result.badge && (
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-medium",
                              result.badge === "In Review" || result.badge === "Pending"
                                ? "bg-warning/15 text-warning-foreground"
                                : result.badge === "Approved" || result.badge === "Completed"
                                  ? "bg-success/15 text-success"
                                  : "bg-muted text-muted-foreground",
                            )}
                          >
                            {result.badge}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}
            </>
          )}

          <CommandSeparator />
          <div className="flex items-center gap-4 px-3 py-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-background px-1 py-0.5 text-[10px]">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-background px-1 py-0.5 text-[10px]">↵</kbd>
              Open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-background px-1 py-0.5 text-[10px]">Esc</kbd>
              Close
            </span>
          </div>
        </CommandList>
      </CommandDialog>
    </>
  );
}