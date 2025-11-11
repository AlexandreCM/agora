package com.agora.dbaccessor.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.agora.dbaccessor.generated.model.CreatePostRequest;
import com.agora.dbaccessor.generated.model.Post;
import com.agora.dbaccessor.mapper.PostMapper;
import com.agora.dbaccessor.model.PostDocument;
import com.agora.dbaccessor.repository.PostRepository;
import com.agora.dbaccessor.service.PostService;

import org.springframework.http.HttpStatus;

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
        return postRepository.findAll().stream()
                .map(postMapper::toApi)
                .toList();
    }

    @Override
    public Post getPost(String id) {
        PostDocument document = postRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        return postMapper.toApi(document);
    }

    @Override
    @Transactional
    public Post createPost(CreatePostRequest request) {
        PostDocument document = postMapper.toDocument(request);
        PostDocument saved = postRepository.save(document);
        return postMapper.toApi(saved);
    }
}
