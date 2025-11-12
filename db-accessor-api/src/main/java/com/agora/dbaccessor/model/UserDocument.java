package com.agora.dbaccessor.model;

import java.time.OffsetDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "users")
public record UserDocument(
        @Id String id,
        String name,
        @Indexed(unique = true) String email,
        String passwordHash,
        OffsetDateTime createdAt) {
}
