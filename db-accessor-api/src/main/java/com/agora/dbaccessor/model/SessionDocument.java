package com.agora.dbaccessor.model;

import java.time.OffsetDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "sessions")
public record SessionDocument(
        @Id String id,
        @Indexed(unique = true) String tokenHash,
        String userId,
        OffsetDateTime createdAt,
        OffsetDateTime expiresAt) {
}
