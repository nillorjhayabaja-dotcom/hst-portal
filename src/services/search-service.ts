// Enterprise Search Service - Mock implementation
import type { SearchResult } from "@/types/enterprise";
import { MOCK_SEARCH_RESULTS } from "@/mock/enterprise-data";
import { EMPLOYEES } from "@/mock/data";

export interface SearchQuery {
  q: string;
  type?: SearchResult["type"] | "all";
  limit?: number;
}

export function searchEnterprise(query: SearchQuery): SearchResult[] {
  const { q, type = "all", limit = 10 } = query;
  if (!q.trim()) return [];

  const normalized = q.toLowerCase().trim();

  let results = MOCK_SEARCH_RESULTS;

  // Filter by type
  if (type !== "all") {
    results = results.filter((r) => r.type === type);
  }

  // Filter by query
  results = results.filter(
    (r) =>
      r.label.toLowerCase().includes(normalized) ||
      r.description.toLowerCase().includes(normalized) ||
      (r.badge && r.badge.toLowerCase().includes(normalized)),
  );

  // Sort by relevance (exact matches first)
  results.sort((a, b) => {
    const aExact = a.label.toLowerCase() === normalized ? -1 : 0;
    const bExact = b.label.toLowerCase() === normalized ? -1 : 0;
    return aExact - bExact;
  });

  return results.slice(0, limit);
}

export function getQuickSearchSuggestions(): string[] {
  return [
    "Gate Pass",
    "Leave request",
    "Dashboard",
    "Notifications",
    "Profile",
    "Approvals",
    "Reports",
    "Employees",
  ];
}

export function searchEmployees(query: string) {
  if (!query.trim()) return [];
  const normalized = query.toLowerCase();
  return EMPLOYEES.filter(
    (e) =>
      e.name.toLowerCase().includes(normalized) ||
      e.id.toLowerCase().includes(normalized) ||
      e.department.toLowerCase().includes(normalized) ||
      e.title.toLowerCase().includes(normalized),
  );
}

export function getSearchResultIcon(type: SearchResult["type"]): string {
  const icons: Record<string, string> = {
    module: "LayoutDashboard",
    employee: "User",
    request: "FileText",
    department: "Building2",
    "control-number": "Hash",
  };
  return icons[type] ?? "Search";
}
