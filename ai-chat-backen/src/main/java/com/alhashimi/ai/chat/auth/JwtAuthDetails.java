package com.alhashimi.ai.chat.auth;

import org.springframework.security.web.authentication.WebAuthenticationDetails;

import java.util.UUID;

/**
 * Custom authentication details that carry forcePasswordChange flag and userId
 * alongside the standard WebAuthenticationDetails (remoteAddress, sessionId).
 */
public class JwtAuthDetails extends WebAuthenticationDetails {

    private final boolean forcePasswordChange;
    private final UUID userId;

    public JwtAuthDetails(WebAuthenticationDetails source, boolean forcePasswordChange, UUID userId) {
        super(source.getRemoteAddress(), source.getSessionId());
        this.forcePasswordChange = forcePasswordChange;
        this.userId = userId;
    }

    public boolean isForcePasswordChange() {
        return forcePasswordChange;
    }

    public UUID getUserId() {
        return userId;
    }
}
