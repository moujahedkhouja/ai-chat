package com.alhashimi.ai.chat.user;

import com.alhashimi.ai.chat.role.Role;

public record UpdateUserRequest(
        Role role,
        String email,
        Boolean enabled,
        String linkedinUrl
) {
}
