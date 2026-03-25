package com.alhashimi.ai.chat.auth;

public record AuthResponse(String token, boolean forcePasswordChange) {
}
