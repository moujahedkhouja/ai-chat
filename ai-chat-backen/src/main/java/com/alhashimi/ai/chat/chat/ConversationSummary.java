package com.alhashimi.ai.chat.chat;

import java.time.Instant;
import java.util.UUID;

/** Lightweight projection returned by GET /api/chat/conversations — no messages. */
public record ConversationSummary(
        UUID    id,
        String  title,
        Instant createdAt,
        Instant updatedAt
) {
    static ConversationSummary from(Conversation c) {
        return new ConversationSummary(c.getId(), c.getTitle(), c.getCreatedAt(), c.getUpdatedAt());
    }
}
