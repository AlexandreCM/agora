package com.agora.dbaccessor.api.controller;

import java.net.URI;
import java.util.Objects;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.agora.dbaccessor.generated.model.CreateUserRequest;
import com.agora.dbaccessor.generated.model.User;
import com.agora.dbaccessor.generated.model.UserWithPassword;
import com.agora.dbaccessor.service.SessionService;
import com.agora.dbaccessor.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/users")
@Validated
public class UserController {

    private final UserService userService;
    private final SessionService sessionService;

    public UserController(UserService userService, SessionService sessionService) {
        this.userService = userService;
        this.sessionService = sessionService;
    }

    @PostMapping
    public ResponseEntity<User> createUser(@Valid @RequestBody CreateUserRequest request) {
        User created = userService.createUser(request);
        return ResponseEntity.created(Objects.requireNonNull(URI.create("/users/" + created.getId()))).body(created);
    }

    @GetMapping(params = "email")
    public ResponseEntity<UserWithPassword> getUserByEmail(@RequestParam("email") String email) {
        UserWithPassword user = userService.getUserByEmail(email);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<User> getUser(@PathVariable String userId) {
        User user = userService.getUser(userId);
        return ResponseEntity.ok(user);
    }

    @DeleteMapping("/{userId}/sessions")
    public ResponseEntity<Void> deleteUserSessions(@PathVariable String userId) {
        sessionService.deleteSessionsForUser(userId);
        return ResponseEntity.noContent().build();
    }
}
