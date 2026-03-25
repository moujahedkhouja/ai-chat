package com.alhashimi.ai.chat.auth;

import java.security.Principal;
import java.util.UUID;

public record JwtPrincipal(UUID userId, String username, String role, boolean forcePasswordChange)
        implements Principal {

    @Override
    public String getName() {
        return username;
    }
}
