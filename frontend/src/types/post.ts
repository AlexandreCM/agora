export const COMMENT_SECTIONS = [
  "avis",
  "analysis",
  "debate",
  "question",
  "proposal",
] as const;

export type CommentSection = (typeof COMMENT_SECTIONS)[number];

export interface CommentReply {
  id: string;
  parentId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  section: CommentSection;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  replies: CommentReply[];
}

export interface Post {
  id: string;
  title: string;
  summary: string;
  sourceUrl: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  likedBy: string[];
  comments: Comment[];
}
