package com.agora.dbaccessor.mapper;

import java.net.URI;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.agora.dbaccessor.generated.model.CreatePostRequest;
import com.agora.dbaccessor.generated.model.Post;
import com.agora.dbaccessor.generated.model.PostComment;
import com.agora.dbaccessor.generated.model.PostCommentReply;
import com.agora.dbaccessor.generated.model.PostCommentSection;
import com.agora.dbaccessor.model.PostDocument;
import com.agora.dbaccessor.model.PostDocument.PostCommentDocument;
import com.agora.dbaccessor.model.PostDocument.PostCommentReplyDocument;

@Mapper(componentModel = "spring")
public interface PostMapper {

    @Mapping(target = "sourceUrl", expression = "java(toUri(document.sourceUrl()))")
    @Mapping(target = "tags", expression = "java(copyStrings(document.tags()))")
    @Mapping(target = "likedBy", expression = "java(copyStrings(document.likedBy()))")
    @Mapping(target = "comments", expression = "java(mapComments(document.comments()))")
    Post toApi(PostDocument document);

    @Mapping(target = "section", expression = "java(toSection(document.section()))")
    @Mapping(target = "replies", expression = "java(mapReplies(document.replies()))")
    @Mapping(target = "authorId", expression = "java(document.authorId())")
    @Mapping(target = "authorName", expression = "java(document.authorName())")
    PostComment toApi(PostCommentDocument document);

    @Mapping(target = "authorId", expression = "java(document.authorId())")
    @Mapping(target = "authorName", expression = "java(document.authorName())")
    PostCommentReply toApi(PostCommentReplyDocument document);

    @Mapping(target = "id", expression = "java(request.getId())")
    @Mapping(target = "sourceUrl", expression = "java(toUrl(request.getSourceUrl()))")
    @Mapping(target = "tags", expression = "java(copyStrings(request.getTags()))")
    @Mapping(target = "createdAt", expression = "java(currentTimestamp())")
    @Mapping(target = "updatedAt", expression = "java(currentTimestamp())")
    @Mapping(target = "likedBy", expression = "java(new java.util.ArrayList<>())")
    @Mapping(target = "comments", expression = "java(new java.util.ArrayList<>())")
    PostDocument toDocument(CreatePostRequest request);

    default List<PostComment> mapComments(List<PostCommentDocument> documents) {
        if (documents == null || documents.isEmpty()) {
            return new ArrayList<>();
        }
        return documents.stream()
                .map(this::toApi)
                .collect(Collectors.toCollection(ArrayList::new));
    }

    default List<PostCommentReply> mapReplies(List<PostCommentReplyDocument> documents) {
        if (documents == null || documents.isEmpty()) {
            return new ArrayList<>();
        }
        return documents.stream()
                .map(this::toApi)
                .collect(Collectors.toCollection(ArrayList::new));
    }

    default URI toUri(String sourceUrl) {
        return sourceUrl != null ? URI.create(sourceUrl) : null;
    }

    default String toUrl(URI sourceUrl) {
        return sourceUrl != null ? sourceUrl.toString() : null;
    }

    default PostCommentSection toSection(String section) {
        return section != null ? PostCommentSection.fromValue(section) : null;
    }

    default List<String> copyStrings(List<String> values) {
        return values != null ? new ArrayList<>(values) : new ArrayList<>();
    }

    default OffsetDateTime currentTimestamp() {
        return OffsetDateTime.now();
    }

    default int calculateLikes(List<String> likedBy) {
        return likedBy != null ? likedBy.size() : 0;
    }
}
