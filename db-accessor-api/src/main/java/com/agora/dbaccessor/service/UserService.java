package com.agora.dbaccessor.service;

import com.agora.dbaccessor.generated.model.CreateUserRequest;
import com.agora.dbaccessor.generated.model.User;
import com.agora.dbaccessor.generated.model.UserWithPassword;

public interface UserService {

    User createUser(CreateUserRequest request);

    UserWithPassword getUserByEmail(String email);

    User getUser(String userId);
}
