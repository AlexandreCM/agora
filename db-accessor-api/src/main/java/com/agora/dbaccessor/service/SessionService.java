package com.agora.dbaccessor.service;

import com.agora.dbaccessor.generated.model.CreateSessionRequest;
import com.agora.dbaccessor.generated.model.Session;
import com.agora.dbaccessor.generated.model.User;

public interface SessionService {

    Session createSession(CreateSessionRequest request);

    void deleteSession(String tokenHash);

    User validateSession(String tokenHash);

    void deleteSessionsForUser(String userId);
}
