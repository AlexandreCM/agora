package com.agora.dbaccessor.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.agora.dbaccessor.model.UserDocument;

public interface UserRepository extends MongoRepository<UserDocument, String> {

    Optional<UserDocument> findByEmail(String email);
}
