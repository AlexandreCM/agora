package com.agora.dbaccessor.mapper;

import java.time.OffsetDateTime;
import java.net.URI;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

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

    public Post toApi(PostDocument document) {
        Post post = new Post();
        post.setId(document.getId());
        post.setTitle(document.getTitle());
        post.setSummary(document.getSummary());
        if (document.getSourceUrl() != null) {
            post.setSourceUrl(URI.create(document.getSourceUrl()));
        }
        post.setTags(new ArrayList<>(Optional.ofNullable(document.getTags()).orElseGet(List::of)));
        post.setCreatedAt(document.getCreatedAt());
        post.setLikedBy(document.getLikedBy());
        post.setComments(mapComments(document.getComments()));
        return post;
    }

    public PostDocument toDocument(CreatePostRequest request) {
        OffsetDateTime now = OffsetDateTime.now();
        PostDocument document = new PostDocument();
        document.setTitle(request.getTitle());
        document.setSummary(request.getSummary());
        if (request.getSourceUrl() != null) {
            document.setSourceUrl(request.getSourceUrl().toString());
        }
        document.setTags(new ArrayList<>(Optional.ofNullable(request.getTags()).orElseGet(Collections::emptyList)));
        document.setCreatedAt(now);
        document.setUpdatedAt(now);
        document.setLikedBy(new ArrayList<>());
        document.setComments(new ArrayList<>());
        return document;
    }

    public void updateTimestamps(PostDocument document) {
        if (document.getCreatedAt() == null) {
            document.setCreatedAt(OffsetDateTime.now());
        }
        document.setUpdatedAt(OffsetDateTime.now());
    }

    private List<PostComment> mapComments(List<PostCommentDocument> commentDocuments) {
        if (commentDocuments == null || commentDocuments.isEmpty()) {
            return new ArrayList<>();
        }
        return commentDocuments.stream()
                .map(this::mapComment)
                .toList();
    }

    private PostComment mapComment(PostCommentDocument document) {
        PostComment comment = new PostComment();
        comment.setId(document.getId());
        if (document.getSection() != null) {
            comment.setSection(PostCommentSection.fromValue(document.getSection()));
        }
        comment.setAuthorName(document.getAuthorName());
        comment.setAuthorId(document.getAuthorId());
        comment.setContent(document.getContent());
        comment.setCreatedAt(document.getCreatedAt());
        comment.setReplies(mapReplies(document.getReplies()));
        return comment;
    }

    private List<PostCommentReply> mapReplies(List<PostCommentReplyDocument> replyDocuments) {
        if (replyDocuments == null || replyDocuments.isEmpty()) {
            return new ArrayList<>();
        }
        return replyDocuments.stream()
                .map(this::mapReply)
                .toList();
    }

    private PostCommentReply mapReply(PostCommentReplyDocument document) {
        PostCommentReply reply = new PostCommentReply();
        reply.setId(document.getId());
        reply.setParentId(document.getParentId());
        reply.setAuthorName(document.getAuthorName());
        reply.setAuthorId(document.getAuthorId());
        reply.setContent(document.getContent());
        reply.setCreatedAt(document.getCreatedAt());
        return reply;
    }
}
