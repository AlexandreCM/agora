package com.agora.dbaccessor.model;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "posts")
public class PostDocument {

    @Id
    private String id;
    private String title;
    private String summary;
    private String sourceUrl;
    private List<String> tags = new ArrayList<>();
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private List<String> likedBy = new ArrayList<>();
    private List<PostCommentDocument> comments = new ArrayList<>();

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getSourceUrl() {
        return sourceUrl;
    }

    public void setSourceUrl(String sourceUrl) {
        this.sourceUrl = sourceUrl;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags != null ? tags : new ArrayList<>();
    }

    public List<String> getLikedBy() {
        return likedBy;
    }

    public void setLikedBy(List<String> likedBy) {
        this.likedBy = likedBy != null ? likedBy : new ArrayList<>();
    }

    public List<PostCommentDocument> getComments() {
        return comments;
    }

    public void setComments(List<PostCommentDocument> comments) {
        this.comments = comments != null ? comments : new ArrayList<>();
    }

    public static class PostCommentDocument {

        private String id;
        private String section;
        private String authorName;
        private String authorId;
        private String content;
        private OffsetDateTime createdAt;
        private List<PostCommentReplyDocument> replies = new ArrayList<>();

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getSection() {
            return section;
        }

        public void setSection(String section) {
            this.section = section;
        }

        public String getAuthorName() {
            return authorName;
        }

        public void setAuthorName(String authorName) {
            this.authorName = authorName;
        }

        public String getAuthorId() {
            return authorId;
        }

        public void setAuthorId(String authorId) {
            this.authorId = authorId;
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }

        public OffsetDateTime getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(OffsetDateTime createdAt) {
            this.createdAt = createdAt;
        }

        public List<PostCommentReplyDocument> getReplies() {
            return replies;
        }

        public void setReplies(List<PostCommentReplyDocument> replies) {
            this.replies = replies != null ? replies : new ArrayList<>();
        }
    }

    public static class PostCommentReplyDocument {

        private String id;
        private String parentId;
        private String authorName;
        private String authorId;
        private String content;
        private OffsetDateTime createdAt;

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getParentId() {
            return parentId;
        }

        public void setParentId(String parentId) {
            this.parentId = parentId;
        }

        public String getAuthorName() {
            return authorName;
        }

        public void setAuthorName(String authorName) {
            this.authorName = authorName;
        }

        public String getAuthorId() {
            return authorId;
        }

        public void setAuthorId(String authorId) {
            this.authorId = authorId;
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }

        public OffsetDateTime getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(OffsetDateTime createdAt) {
            this.createdAt = createdAt;
        }
    }
}
