package com.alhashimi.ai.chat.auth;

import java.util.UUID;

class JwtAuthDetails {

    private final UUID userId;

    JwtAuthDetails(UUID userId) {
        this.userId = userId;
    }

    UUID getUserId() {
        return userId;
    }
}
