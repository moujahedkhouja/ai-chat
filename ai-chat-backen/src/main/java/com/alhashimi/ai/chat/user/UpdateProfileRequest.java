package com.alhashimi.ai.chat.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank @Size(max = 50) String username,
        @NotBlank @Email String email,
        String firstName,
        String lastName
) {}
