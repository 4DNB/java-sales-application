package com.example.microservice.user.domain.exception;

public class UserNotFoundException extends DomainException {
    public UserNotFoundException(Long id) {
        super("User not found with id: " + id);
    }

    public UserNotFoundException(String message) {
        super(message);
    }
}
