package com.agora.dbaccessor.mapper;

import java.time.OffsetDateTime;

import org.springframework.stereotype.Component;

import com.agora.dbaccessor.generated.model.CreateSessionRequest;
import com.agora.dbaccessor.generated.model.Session;
import com.agora.dbaccessor.model.SessionDocument;

@Component
public class SessionMapper {

    public Session toApi(SessionDocument document) {
        if (document == null) {
            return null;
        }

        return new Session()
                .id(document.id())
                .tokenHash(document.tokenHash())
                .userId(document.userId())
                .createdAt(document.createdAt())
                .expiresAt(document.expiresAt());
    }

    public SessionDocument toDocument(CreateSessionRequest request) {
        OffsetDateTime createdAt = OffsetDateTime.now();
        String tokenHash = request.getTokenHash() != null ? request.getTokenHash().trim() : null;
        String userId = request.getUserId() != null ? request.getUserId().trim() : null;
        return new SessionDocument(null, tokenHash, userId, createdAt, request.getExpiresAt());
    }
}
