package com.alhashimi.ai.chat.user;

import java.util.List;

public record UserPage(
        List<UserResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
