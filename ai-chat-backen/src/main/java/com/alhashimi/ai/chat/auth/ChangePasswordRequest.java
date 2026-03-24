package com.alhashimi.ai.chat.auth;

import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        String currentPassword,
        @Size(min = 8) String newPassword
) {
}
