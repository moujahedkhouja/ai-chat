package com.alhashimi.ai.chat.user;

import com.alhashimi.ai.chat.role.Role;
import java.time.Instant;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String username,
        String email,
        Role role,
        boolean enabled,
        boolean forcePasswordChange,
        String profilePicturePath,
        String linkedinUrl,
        Instant createdAt,
        Instant updatedAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                user.isEnabled(),
                user.isForcePasswordChange(),
                user.getProfilePicturePath(),
                user.getLinkedinUrl(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
