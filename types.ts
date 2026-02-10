
export interface AppData {
  id: string;
  name: string;
  icon: string;
  banner?: string; // Large landscape image for trending/featured section
  desc: string;
  link: string;
  cat: Category;
  trending: boolean;
  rating: number;
  downloads: string;
  price?: number; // 0 for Free, or a positive number
}

export type Category = "All" | "Games" | "Social" | "Editors" | "Tools" | "Productivity" | "Books";

export interface SearchState {
  query: string;
  category: Category;
}

export interface AIRecommendation {
  name: string;
  reason: string;
}
