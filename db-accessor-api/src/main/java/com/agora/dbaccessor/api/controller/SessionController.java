package com.agora.dbaccessor.api.controller;

import java.net.URI;
import java.util.Objects;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.agora.dbaccessor.generated.model.CreateSessionRequest;
import com.agora.dbaccessor.generated.model.Session;
import com.agora.dbaccessor.generated.model.User;
import com.agora.dbaccessor.generated.model.ValidateSessionRequest;
import com.agora.dbaccessor.service.SessionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/sessions")
@Validated
public class SessionController {

    private final SessionService sessionService;

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @PostMapping
    public ResponseEntity<Session> createSession(@Valid @RequestBody CreateSessionRequest request) {
        Session created = sessionService.createSession(request);
        return ResponseEntity.created(Objects.requireNonNull(URI.create("/sessions/" + created.getTokenHash()))).body(created);
    }

    @DeleteMapping("/{tokenHash}")
    public ResponseEntity<Void> deleteSession(@PathVariable String tokenHash) {
        sessionService.deleteSession(tokenHash);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/validate")
    public ResponseEntity<User> validateSession(@Valid @RequestBody ValidateSessionRequest request) {
        User user = sessionService.validateSession(request.getTokenHash());
        return ResponseEntity.ok(user);
    }
}
