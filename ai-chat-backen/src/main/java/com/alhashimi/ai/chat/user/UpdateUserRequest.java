package com.alhashimi.ai.chat.user;

import com.alhashimi.ai.chat.role.Role;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
        @Size(min = 3, max = 50) String username,
        Role role,
        String email,
        String firstName,
        String lastName,
        Boolean enabled,
        String linkedinUrl
) {
}
