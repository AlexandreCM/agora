package com.agora.dbaccessor.service;

import java.util.List;

import com.agora.dbaccessor.generated.model.CreatePostRequest;
import com.agora.dbaccessor.generated.model.Post;

public interface PostService {

    List<Post> listPosts();

    Post getPost(String id);

    Post createPost(CreatePostRequest request);
}
