package com.agora.dbaccessor.mapper;

import java.net.URI;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.agora.dbaccessor.generated.model.CreatePostRequest;
import com.agora.dbaccessor.generated.model.Post;
import com.agora.dbaccessor.generated.model.PostComment;
import com.agora.dbaccessor.generated.model.PostCommentReply;
import com.agora.dbaccessor.generated.model.PostCommentSection;
import com.agora.dbaccessor.model.PostDocument;
import com.agora.dbaccessor.model.PostDocument.PostCommentDocument;
import com.agora.dbaccessor.model.PostDocument.PostCommentReplyDocument;

@Component
public class PostMapper {

    public Post map(PostDocument document) {
        if (document == null) {
            return null;
        }

        return new Post()
                .id(document.id())
                .title(document.title())
                .summary(document.summary())
                .sourceUrl(toUri(document.sourceUrl()))
                .tags(copyStrings(document.tags()))
                .createdAt(document.createdAt())
                .updatedAt(document.updatedAt())
                .likedBy(copyStrings(document.likedBy()))
                .comments(mapComments(document.comments()));
    }

    public List<PostComment> mapComments(List<PostCommentDocument> documents) {
        if (documents == null || documents.isEmpty()) {
            return new ArrayList<>();
        }
        return documents.stream()
                .map(this::map)
                .collect(Collectors.toCollection(ArrayList::new));
    }

    public PostComment map(PostCommentDocument document) {
        if (document == null) {
            return null;
        }

        return new PostComment()
                .id(document.id())
                .section(toSection(document.section()))
                .authorId(document.authorId())
                .authorName(document.authorName())
                .content(document.content())
                .createdAt(document.createdAt())
                .replies(mapReplies(document.replies()));
    }

    public List<PostCommentReply> mapReplies(List<PostCommentReplyDocument> documents) {
        if (documents == null || documents.isEmpty()) {
            return new ArrayList<>();
        }
        return documents.stream()
                .map(this::map)
                .collect(Collectors.toCollection(ArrayList::new));
    }

    public PostCommentReply map(PostCommentReplyDocument document) {
        if (document == null) {
            return null;
        }

        return new PostCommentReply()
                .id(document.id())
                .parentId(document.parentId())
                .authorId(document.authorId())
                .authorName(document.authorName())
                .content(document.content())
                .createdAt(document.createdAt());
    }

    // ---------------------------------------------------------------------------

    public PostDocument map(CreatePostRequest request) {
        if (request == null) {
            return null;
        }

        String id = UUID.randomUUID().toString();
        String title = request.getTitle() != null ? request.getTitle().trim() : null;
        String summary = request.getSummary() != null ? request.getSummary().trim() : null;
        String sourceUrl = toUrl(request.getSourceUrl());
        List<String> tags = copyStrings(request.getTags());
        OffsetDateTime now = currentTimestamp();
        List<String> likedBy = new ArrayList<>();
        List<PostCommentDocument> comments = new ArrayList<>();

        return new PostDocument(id, title, summary, sourceUrl, tags, now, now, likedBy, comments);
    }

    // ---------------------------------------------------------------------------

    private URI toUri(String sourceUrl) {
        return sourceUrl != null ? URI.create(sourceUrl) : null;
    }

    private String toUrl(URI sourceUrl) {
        return sourceUrl != null ? sourceUrl.toString() : null;
    }

    private OffsetDateTime currentTimestamp() {
        return OffsetDateTime.now();
    }

    private PostCommentSection toSection(String section) {
        return section != null ? PostCommentSection.fromValue(section) : null;
    }

    private List<String> copyStrings(List<String> values) {
        return values != null ? new ArrayList<>(values) : new ArrayList<>();
    }

}
