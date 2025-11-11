package com.agora.dbaccessor.service.impl;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.agora.dbaccessor.generated.model.CreatePostCommentRequest;
import com.agora.dbaccessor.generated.model.CreatePostRequest;
import com.agora.dbaccessor.generated.model.Post;
import com.agora.dbaccessor.generated.model.PostComment;
import com.agora.dbaccessor.generated.model.PostCommentReply;
import com.agora.dbaccessor.generated.model.TogglePostLikeRequest;
import com.agora.dbaccessor.mapper.PostMapper;
import com.agora.dbaccessor.model.PostDocument;
import com.agora.dbaccessor.model.PostDocument.PostCommentDocument;
import com.agora.dbaccessor.model.PostDocument.PostCommentReplyDocument;
import com.agora.dbaccessor.repository.PostRepository;
import com.agora.dbaccessor.service.PostService;

@Service
@Transactional(readOnly = true)
public class PostServiceImpl implements PostService {

    private static final List<String> COMMENT_SECTIONS = List.of("avis", "analysis", "debate", "question", "proposal");

    private final PostRepository postRepository;
    private final PostMapper postMapper;

    public PostServiceImpl(PostRepository postRepository, PostMapper postMapper) {
        this.postRepository = postRepository;
        this.postMapper = postMapper;
    }

    @Override
    public List<Post> listPosts() {
        List<PostDocument> documents = postRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        return documents.stream()
                .map(postMapper::toApi)
                .toList();
    }

    @Override
    public Post getPost(String id) {
        PostDocument document = findPostDocument(id);
        return postMapper.toApi(document);
    }

    private PostDocument findPostDocument(String id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
    }

    @Override
    @Transactional
    public Post createPost(CreatePostRequest request) {
        PostDocument mapped = postMapper.toDocument(request);

        String sourceUrl = normaliseSourceUrl(mapped.sourceUrl());

        if (sourceUrl == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Source URL is required");
        }

        if (postRepository.existsBySourceUrl(sourceUrl)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Post with this source URL already exists");
        }

        String id = normaliseIdentifier(mapped.id());
        OffsetDateTime createdAt = defaultTimestamp(mapped.createdAt());
        OffsetDateTime updatedAt = mapped.updatedAt() != null ? mapped.updatedAt() : createdAt;

        PostDocument document = new PostDocument(
                id,
                Objects.requireNonNullElse(mapped.title(), ""),
                Objects.requireNonNullElse(mapped.summary(), ""),
                sourceUrl,
                new ArrayList<>(mapped.tags()),
                createdAt,
                updatedAt,
                new ArrayList<>(),
                new ArrayList<>());

        PostDocument saved = postRepository.save(document);
        return postMapper.toApi(saved);
    }

    @Override
    public Post findPostBySourceUrl(String sourceUrl) {
        String lookupUrl = normaliseSourceUrl(sourceUrl);

        if (lookupUrl == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Source URL is required");
        }

        PostDocument document = postRepository.findBySourceUrl(lookupUrl)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        return postMapper.toApi(document);
    }

    @Override
    @Transactional
    public Post togglePostLike(String postId, TogglePostLikeRequest request) {
        String userId = request.getUserId();

        if (userId == null || userId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User id is required");
        }

        String normalisedUserId = userId.trim();

        PostDocument document = findPostDocument(postId);
        List<String> likedBy = document.likedBy().stream()
                .filter(value -> value != null && !value.trim().isEmpty())
                .map(String::trim)
                .collect(Collectors.toCollection(ArrayList::new));

        boolean alreadyLiked = likedBy.stream()
                .filter(value -> value != null && !value.isBlank())
                .anyMatch(value -> value.equals(normalisedUserId));

        if (alreadyLiked) {
            likedBy.removeIf(value -> value != null && value.equals(normalisedUserId));
        } else {
            likedBy.add(normalisedUserId);
        }

        PostDocument updated = rebuildDocument(document, likedBy, document.comments());
        PostDocument saved = postRepository.save(updated);

        return postMapper.toApi(saved);
    }

    @Override
    @Transactional
    public Post addComment(String id, CreatePostCommentRequest request) {
        PostDocument document = findPostDocument(id);

        if (request.getReply() != null) {
            PostDocument updated = appendReply(document, request.getReply());
            PostDocument saved = postRepository.save(updated);
            return postMapper.toApi(saved);
        }

        if (request.getComment() != null) {
            PostDocument updated = appendComment(document, request.getComment());
            PostDocument saved = postRepository.save(updated);
            return postMapper.toApi(saved);
        }

        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing comment or reply payload");
    }

    private PostDocument appendComment(PostDocument document, PostComment comment) {
        String content = comment.getContent() != null ? comment.getContent().trim() : "";

        if (content.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment content is required");
        }

        List<PostCommentDocument> comments = new ArrayList<>(document.comments());
        comments.add(toCommentDocument(comment, content));

        return rebuildDocument(document, document.likedBy(), comments);
    }

    private PostDocument appendReply(PostDocument document, PostCommentReply reply) {
        String content = reply.getContent() != null ? reply.getContent().trim() : "";

        if (content.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reply content is required");
        }

        String parentId = reply.getParentId() != null ? reply.getParentId().trim() : "";

        if (parentId.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Parent comment identifier is required");
        }

        List<PostCommentDocument> comments = new ArrayList<>(document.comments());
        boolean updated = false;

        for (int index = 0; index < comments.size(); index++) {
            PostCommentDocument existing = comments.get(index);

            if (!parentId.equals(existing.id())) {
                continue;
            }

            List<PostCommentReplyDocument> replies = new ArrayList<>(existing.replies());
            replies.add(toReplyDocument(reply, parentId, content));

            PostCommentDocument updatedComment = new PostCommentDocument(
                    existing.id(),
                    existing.section(),
                    existing.authorId(),
                    existing.authorName(),
                    existing.content(),
                    existing.createdAt(),
                    replies);

            comments.set(index, updatedComment);
            updated = true;
            break;
        }

        if (!updated) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found");
        }

        return rebuildDocument(document, document.likedBy(), comments);
    }

    private PostDocument rebuildDocument(PostDocument original, List<String> likedBy, List<PostCommentDocument> comments) {
        return new PostDocument(
                original.id(),
                original.title(),
                original.summary(),
                original.sourceUrl(),
                original.tags(),
                original.createdAt(),
                OffsetDateTime.now(),
                likedBy,
                comments);
    }

    private PostCommentDocument toCommentDocument(PostComment comment, String content) {
        OffsetDateTime createdAt = comment.getCreatedAt() != null ? comment.getCreatedAt() : OffsetDateTime.now();

        List<PostCommentReplyDocument> replies = comment.getReplies() != null
                ? comment.getReplies().stream()
                        .map(reply -> {
                            String replyContent = reply.getContent() != null ? reply.getContent().trim() : "";
                            String parentId = reply.getParentId() != null ? reply.getParentId().trim() : "";
                            return toReplyDocument(reply, parentId, replyContent);
                        })
                        .collect(Collectors.toCollection(ArrayList::new))
                : new ArrayList<>();

        String section = comment.getSection() != null ? comment.getSection().getValue() : null;
        section = normaliseSection(section);

        return new PostCommentDocument(
                normaliseIdentifier(comment.getId()),
                section,
                comment.getAuthorId(),
                comment.getAuthorName(),
                content,
                createdAt,
                replies);
    }

    private PostCommentReplyDocument toReplyDocument(PostCommentReply reply, String parentId, String content) {
        OffsetDateTime createdAt = reply.getCreatedAt() != null ? reply.getCreatedAt() : OffsetDateTime.now();

        return new PostCommentReplyDocument(
                normaliseIdentifier(reply.getId()),
                parentId,
                reply.getAuthorId(),
                reply.getAuthorName(),
                content,
                createdAt);
    }

    private String normaliseIdentifier(String id) {
        if (id == null) {
            return UUID.randomUUID().toString();
        }

        String trimmed = id.trim();
        return trimmed.isEmpty() ? UUID.randomUUID().toString() : trimmed;
    }

    private OffsetDateTime defaultTimestamp(OffsetDateTime timestamp) {
        return timestamp != null ? timestamp : OffsetDateTime.now();
    }

    private String normaliseSection(String section) {
        if (section == null || section.isBlank()) {
            return COMMENT_SECTIONS.get(0);
        }

        String lowerCase = section.toLowerCase();
        return COMMENT_SECTIONS.contains(lowerCase) ? lowerCase : COMMENT_SECTIONS.get(0);
    }

    private String normaliseSourceUrl(String sourceUrl) {
        if (sourceUrl == null) {
            return null;
        }

        String trimmed = sourceUrl.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
