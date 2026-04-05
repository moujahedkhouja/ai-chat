package com.alhashimi.ai.chat.auth;

public record AuthResponse(
    String userId,
    String username,
    String firstName,
    String lastName,
    String role,
    boolean forcePasswordChange,
    boolean hasAvatar
) {}
