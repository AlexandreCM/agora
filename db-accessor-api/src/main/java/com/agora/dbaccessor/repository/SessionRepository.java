package com.agora.dbaccessor.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.agora.dbaccessor.model.SessionDocument;

public interface SessionRepository extends MongoRepository<SessionDocument, String> {

    Optional<SessionDocument> findByTokenHash(String tokenHash);

    void deleteByTokenHash(String tokenHash);

    List<SessionDocument> findByUserId(String userId);

    void deleteByUserId(String userId);
}
