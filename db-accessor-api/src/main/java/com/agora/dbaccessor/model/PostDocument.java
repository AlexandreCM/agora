package com.agora.dbaccessor.model;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "posts")
public record PostDocument(
        @Id String id,
        String title,
        String summary,
        String sourceUrl,
        List<String> tags,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        List<String> likedBy,
        List<PostCommentDocument> comments) {

    public PostDocument {
        tags = tags != null ? new ArrayList<>(tags) : new ArrayList<>();
        likedBy = likedBy != null ? new ArrayList<>(likedBy) : new ArrayList<>();
        comments = comments != null ? new ArrayList<>(comments) : new ArrayList<>();
    }

    public record PostCommentDocument(
            String id,
            String section,
            String authorName,
            String authorId,
            String content,
            OffsetDateTime createdAt,
            List<PostCommentReplyDocument> replies) {

        public PostCommentDocument {
            replies = replies != null ? new ArrayList<>(replies) : new ArrayList<>();
        }
    }

    public record PostCommentReplyDocument(
            String id,
            String parentId,
            String authorName,
            String authorId,
            String content,
            OffsetDateTime createdAt) {
    }
}
