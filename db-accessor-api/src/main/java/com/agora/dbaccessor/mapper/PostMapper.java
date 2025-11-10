package com.agora.dbaccessor.mapper;

import java.time.OffsetDateTime;

import org.springframework.stereotype.Component;

import com.agora.dbaccessor.generated.model.CreatePostRequest;
import com.agora.dbaccessor.generated.model.Post;
import com.agora.dbaccessor.model.PostDocument;

@Component
public class PostMapper {

    public Post toApi(PostDocument document) {
        Post post = new Post();
        post.setId(document.getId());
        post.setTitle(document.getTitle());
        post.setContent(document.getContent());
        post.setAuthor(document.getAuthor());
        post.setCreatedAt(document.getCreatedAt());
        post.setUpdatedAt(document.getUpdatedAt());
        return post;
    }

    public PostDocument toDocument(CreatePostRequest request) {
        OffsetDateTime now = OffsetDateTime.now();
        PostDocument document = new PostDocument();
        document.setTitle(request.getTitle());
        document.setContent(request.getContent());
        document.setAuthor(request.getAuthor());
        document.setCreatedAt(now);
        document.setUpdatedAt(now);
        return document;
    }

    public void updateTimestamps(PostDocument document) {
        if (document.getCreatedAt() == null) {
            document.setCreatedAt(OffsetDateTime.now());
        }
        document.setUpdatedAt(OffsetDateTime.now());
    }
}
