package com.alhashimi.ai.chat.chat;

import java.time.Instant;
import java.util.UUID;

public record MessageDto(
        UUID    id,
        String  role,
        String  content,
        Instant createdAt
) {
    static MessageDto from(Message m) {
        return new MessageDto(m.getId(), m.getRole(), m.getContent(), m.getCreatedAt());
    }
}
