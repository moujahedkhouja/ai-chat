package com.alhashimi.ai.chat.auth;

public record AuthResponse(
    String userId,
    String username,
    String role,
    boolean forcePasswordChange,
    String profilePicturePath
) {}
