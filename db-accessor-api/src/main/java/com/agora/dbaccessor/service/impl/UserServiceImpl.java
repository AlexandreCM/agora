package com.agora.dbaccessor.service.impl;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.agora.dbaccessor.generated.model.CreateUserRequest;
import com.agora.dbaccessor.generated.model.User;
import com.agora.dbaccessor.generated.model.UserWithPassword;
import com.agora.dbaccessor.mapper.UserMapper;
import com.agora.dbaccessor.model.UserDocument;
import com.agora.dbaccessor.repository.UserRepository;
import com.agora.dbaccessor.service.UserService;

@Service
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public UserServiceImpl(UserRepository userRepository, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
    }

    @Override
    @Transactional
    public User createUser(CreateUserRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }

        if (request.getName() == null || request.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name is required");
        }

        if (request.getPasswordHash() == null || request.getPasswordHash().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password hash is required");
        }

        String normalisedEmail = request.getEmail().trim().toLowerCase();

        boolean alreadyExists = userRepository.findByEmail(normalisedEmail).isPresent();

        if (alreadyExists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        UserDocument document = userMapper.toDocument(request);
        UserDocument saved = userRepository.save(document);

        return userMapper.toApi(saved);
    }

    @Override
    public UserWithPassword getUserByEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }

        UserDocument document = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return userMapper.toApiWithPassword(document);
    }

    @Override
    public User getUser(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User identifier is required");
        }

        UserDocument document = userRepository.findById(userId.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return userMapper.toApi(document);
    }
}
