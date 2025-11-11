package com.agora.dbaccessor.service;

import java.util.List;

import com.agora.dbaccessor.generated.model.CreatePostCommentRequest;
import com.agora.dbaccessor.generated.model.CreatePostRequest;
import com.agora.dbaccessor.generated.model.Post;
import com.agora.dbaccessor.generated.model.TogglePostLikeRequest;

public interface PostService {

    List<Post> listPosts();

    Post getPost(String id);

    Post createPost(CreatePostRequest request);

    Post findPostBySourceUrl(String sourceUrl);

    Post togglePostLike(String id, TogglePostLikeRequest request);

    Post addComment(String id, CreatePostCommentRequest request, String viewerId);
}
