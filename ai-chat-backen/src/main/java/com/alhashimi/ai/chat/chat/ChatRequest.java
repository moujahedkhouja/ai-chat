package com.alhashimi.ai.chat.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Request body for POST /api/chat/message.
 * The frontend sends the full conversation history so the model has context.
 */
public record ChatRequest(

        @NotBlank(message = "conversationId must not be blank")
        String conversationId,

        @NotBlank(message = "content must not be blank")
        @Size(max = 8000, message = "content must not exceed 8000 characters")
        String content,

        /** Previous messages in the conversation (oldest first). May be null or empty for a new chat. */
        List<ChatMessage> history
) {
    public record ChatMessage(
            @NotBlank String role,    // "user" | "assistant"
            @NotBlank String content
    ) {}
}

