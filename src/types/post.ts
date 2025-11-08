export const COMMENT_SECTIONS = [
  "analysis",
  "debate",
  "question",
  "proposal",
  "avis",
] as const;

export type CommentSection = (typeof COMMENT_SECTIONS)[number];

export interface Comment {
  id: string;
  section: CommentSection;
  author: string;
  content: string;
  createdAt: string;
}

export interface Post {
  id: string;
  title: string;
  summary: string;
  sourceUrl: string;
  tags: string[];
  createdAt: string;
  likes: number;
  comments: Comment[];
}
