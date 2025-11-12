package com.agora.dbaccessor.service;

import java.util.List;

import com.agora.dbaccessor.generated.model.CreatePostCommentReplyRequest;
import com.agora.dbaccessor.generated.model.CreatePostCommentRequest;
import com.agora.dbaccessor.generated.model.CreatePostRequest;
import com.agora.dbaccessor.generated.model.Post;
import com.agora.dbaccessor.generated.model.TogglePostLikeRequest;

public interface PostService {

    List<Post> listPosts();

    Post getPost(String postId);

    Post createPost(CreatePostRequest request);

    Post findPostBySourceUrl(String sourceUrl);

    Post togglePostLike(String postId, TogglePostLikeRequest request);

    Post addComment(String postId, CreatePostCommentRequest request);

    Post addCommentReply(String postId, String commentId, CreatePostCommentReplyRequest request);
}
