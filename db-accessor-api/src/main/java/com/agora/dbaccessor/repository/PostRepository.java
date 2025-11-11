package com.agora.dbaccessor.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.agora.dbaccessor.model.PostDocument;

public interface PostRepository extends MongoRepository<PostDocument, String> {

    Optional<PostDocument> findBySourceUrl(String sourceUrl);

    boolean existsBySourceUrl(String sourceUrl);
}
