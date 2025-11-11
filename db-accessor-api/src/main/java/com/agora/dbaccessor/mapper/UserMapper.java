package com.agora.dbaccessor.mapper;

import java.time.OffsetDateTime;

import org.springframework.stereotype.Component;

import com.agora.dbaccessor.generated.model.CreateUserRequest;
import com.agora.dbaccessor.generated.model.User;
import com.agora.dbaccessor.generated.model.UserWithPassword;
import com.agora.dbaccessor.model.UserDocument;

@Component
public class UserMapper {

    public User toApi(UserDocument document) {
        if (document == null) {
            return null;
        }

        return new User()
                .id(document.id())
                .name(document.name())
                .email(document.email())
                .createdAt(document.createdAt());
    }

    public UserWithPassword toApiWithPassword(UserDocument document) {
        if (document == null) {
            return null;
        }

        return new UserWithPassword()
                .id(document.id())
                .name(document.name())
                .email(document.email())
                .createdAt(document.createdAt())
                .passwordHash(document.passwordHash());
    }

    public UserDocument toDocument(CreateUserRequest request) {
        OffsetDateTime now = OffsetDateTime.now();
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null;
        String name = request.getName() != null ? request.getName().trim() : null;
        return new UserDocument(null, name, email, request.getPasswordHash(), now);
    }
}
