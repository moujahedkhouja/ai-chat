package com.alhashimi.ai.chat.chat;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Full conversation including all messages — returned by GET /api/chat/conversations/{id}. */
public record ConversationDetail(
        UUID             id,
        String           title,
        Instant          createdAt,
        Instant          updatedAt,
        List<MessageDto> messages
) {
    static ConversationDetail from(Conversation c) {
        List<MessageDto> msgs = c.getMessages().stream()
                .map(MessageDto::from)
                .toList();
        return new ConversationDetail(
                c.getId(), c.getTitle(), c.getCreatedAt(), c.getUpdatedAt(), msgs);
    }
}
