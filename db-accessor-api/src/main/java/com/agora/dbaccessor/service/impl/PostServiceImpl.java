package com.agora.dbaccessor.service.impl;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.agora.dbaccessor.generated.model.CreatePostCommentReplyRequest;
import com.agora.dbaccessor.generated.model.CreatePostCommentRequest;
import com.agora.dbaccessor.generated.model.CreatePostRequest;
import com.agora.dbaccessor.generated.model.Post;
import com.agora.dbaccessor.generated.model.TogglePostLikeRequest;
import com.agora.dbaccessor.mapper.PostMapper;
import com.agora.dbaccessor.model.PostDocument;
import com.agora.dbaccessor.repository.PostRepository;
import com.agora.dbaccessor.service.PostService;

@Service
@Transactional(readOnly = true)
public class PostServiceImpl implements PostService {

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
                .map(postMapper::map)
                .toList();
    }

    @Override
    public Post getPost(String id) {
        PostDocument document = findPostDocument(id);
        return postMapper.map(document);
    }

    private PostDocument findPostDocument(String id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
    }

    @Override
    @Transactional
    public Post createPost(CreatePostRequest request) {
        PostDocument mapped = postMapper.map(request);

        if (postRepository.existsBySourceUrl(mapped.sourceUrl())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Post with this source URL already exists");
        }

        PostDocument saved = postRepository.save(mapped);
        return postMapper.map(saved);
    }

    @Override
    public Post findPostBySourceUrl(String sourceUrl) {
        PostDocument document = postRepository.findBySourceUrl(sourceUrl)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        return postMapper.map(document);
    }

    @Override
    @Transactional
    public Post togglePostLike(String postId, TogglePostLikeRequest request) {
        String userId = request.getUserId().trim();

        PostDocument document = findPostDocument(postId);
        document.likedBy().stream()
                .filter(id -> id.equals(userId))
                .findFirst()
                .ifPresentOrElse(
                        id -> document.likedBy().remove(id),
                        () -> document.likedBy().add(userId));

        return postMapper.map(postRepository.save(document));
    }

    @Override
    @Transactional
    public Post addComment(String postId, CreatePostCommentRequest request) {
        PostDocument document = findPostDocument(postId);
        document.comments().add(postMapper.map(request));

        return postMapper.map(postRepository.save(document));
    }

    @Override
    @Transactional
    public Post addCommentReply(String postId, String commentId, CreatePostCommentReplyRequest request) {
        PostDocument document = findPostDocument(postId);

        if (!document.comments().stream().anyMatch(comment -> commentId.equals(comment.id()))) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found");
        }

        document.comments().stream()
                .filter(comment -> commentId.equals(comment.id()))
                .findFirst()
                .ifPresent(comment -> comment.replies().add(postMapper.map(commentId, request)));

        return postMapper.map(postRepository.save(document));
    }
}
