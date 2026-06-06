import { api, unwrap } from "./api";
import type { SearchResults } from "@/types";

export const searchService = {
  search: (q: string, type?: string, extension?: string) =>
    unwrap<SearchResults>(
      api.get("/search", { params: { q, type, extension } }),
    ),

  suggestions: (q: string) =>
    unwrap<{ suggestions: string[] }>(api.get("/search/suggestions", { params: { q } })),
};
