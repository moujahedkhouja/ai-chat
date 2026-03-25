package com.alhashimi.ai.chat.auth;

import java.util.UUID;

record TokenClaims(UUID userId, String username, String role, boolean forcePasswordChange) {}
