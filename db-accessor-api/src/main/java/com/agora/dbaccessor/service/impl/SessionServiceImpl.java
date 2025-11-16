package com.agora.dbaccessor.service.impl;

import java.time.OffsetDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.agora.dbaccessor.generated.model.CreateSessionRequest;
import com.agora.dbaccessor.generated.model.Session;
import com.agora.dbaccessor.generated.model.User;
import com.agora.dbaccessor.mapper.SessionMapper;
import com.agora.dbaccessor.mapper.UserMapper;
import com.agora.dbaccessor.model.SessionDocument;
import com.agora.dbaccessor.model.UserDocument;
import com.agora.dbaccessor.repository.SessionRepository;
import com.agora.dbaccessor.repository.UserRepository;
import com.agora.dbaccessor.service.SessionService;

@Service
@Transactional(readOnly = true)
public class SessionServiceImpl implements SessionService {

    private final SessionRepository sessionRepository;
    private final SessionMapper sessionMapper;
    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public SessionServiceImpl(
            SessionRepository sessionRepository,
            SessionMapper sessionMapper,
            UserRepository userRepository,
            UserMapper userMapper) {
        this.sessionRepository = sessionRepository;
        this.sessionMapper = sessionMapper;
        this.userRepository = userRepository;
        this.userMapper = userMapper;
    }

    @Override
    @Transactional
    public Session createSession(CreateSessionRequest request) {
        if (request.getTokenHash() == null || request.getTokenHash().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token hash is required");
        }

        if (request.getUserId() == null || request.getUserId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User identifier is required");
        }

        if (request.getExpiresAt() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Expiration date is required");
        }

        userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        SessionDocument document = sessionMapper.toDocument(request);
        SessionDocument saved = sessionRepository.save(document);
        return sessionMapper.toApi(saved);
    }

    @Override
    @Transactional
    public void deleteSession(String tokenHash) {
        String normalised = tokenHash != null ? tokenHash.trim() : "";

        if (normalised.isEmpty()) {
            return;
        }

        sessionRepository.deleteByTokenHash(normalised);
    }

    @Override
    public User validateSession(String tokenHash) {
        String normalised = tokenHash != null ? tokenHash.trim() : "";

        if (normalised.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found");
        }

        SessionDocument document = sessionRepository.findByTokenHash(normalised)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));

        if (document.expiresAt() != null && document.expiresAt().isBefore(OffsetDateTime.now())) {
            sessionRepository.deleteByTokenHash(normalised);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found");
        }

        UserDocument userDocument = userRepository.findById(document.userId())
                .orElseThrow(() -> {
                    sessionRepository.deleteByTokenHash(normalised);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found");
                });

        return userMapper.toApi(userDocument);
    }

    @Override
    @Transactional
    public void deleteSessionsForUser(String userId) {
        String normalised = userId != null ? userId.trim() : "";

        if (normalised.isEmpty()) {
            return;
        }

        sessionRepository.deleteByUserId(normalised);
    }
}
