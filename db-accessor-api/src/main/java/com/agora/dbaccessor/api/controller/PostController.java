package com.agora.dbaccessor.api.controller;

import java.net.URI;
import java.util.List;
import java.util.Objects;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.agora.dbaccessor.generated.model.CreatePostCommentRequest;
import com.agora.dbaccessor.generated.model.CreatePostRequest;
import com.agora.dbaccessor.generated.model.Post;
import com.agora.dbaccessor.generated.model.TogglePostLikeRequest;
import com.agora.dbaccessor.service.PostService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/posts")
@Validated
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @GetMapping
    public ResponseEntity<List<Post>> listPosts() {
        List<Post> posts = postService.listPosts();
        return ResponseEntity.ok(posts);
    }

    @GetMapping("/{postId}")
    public ResponseEntity<Post> getPost(
            @PathVariable String postId) {
        Post post = postService.getPost(postId);
        return ResponseEntity.ok(post);
    }

    @GetMapping("/source")
    public ResponseEntity<Post> findPostBySource(
            @RequestParam("sourceUrl") String sourceUrl) {
        Post post = postService.findPostBySourceUrl(sourceUrl);
        return ResponseEntity.ok(post);
    }

    @PostMapping
    public ResponseEntity<Post> createPost(@Valid @RequestBody CreatePostRequest request) {
        Post created = postService.createPost(request);
        return ResponseEntity.created(Objects.requireNonNull(URI.create("/posts/" + created.getId()))).body(created);
    }

    @PostMapping("/{postId}/like")
    public ResponseEntity<Post> togglePostLike(
            @PathVariable String postId,
            @Valid @RequestBody TogglePostLikeRequest request) {
        Post updated = postService.togglePostLike(postId, request);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{postId}/comments")
    public ResponseEntity<Post> addComment(
            @PathVariable String postId,
            @Valid @RequestBody CreatePostCommentRequest request,
            @RequestParam(name = "viewerId", required = false) String viewerId) {
        Post updated = postService.addComment(postId, request, viewerId);
        return ResponseEntity.ok(updated);
    }
}
