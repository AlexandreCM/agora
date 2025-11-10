package com.agora.dbaccessor.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.agora.dbaccessor.model.PostDocument;

public interface PostRepository extends MongoRepository<PostDocument, String> {
}
