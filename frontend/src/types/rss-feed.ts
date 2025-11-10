export interface RssFeed {
  id: string;
  label: string;
  url: string;
  tags: string[];
  active: boolean;
  createdAt: string;
  lastFetchedAt: string | null;
}

export interface RssImportResult {
  processedItems: number;
  createdPosts: number;
  errors: string[];
}
