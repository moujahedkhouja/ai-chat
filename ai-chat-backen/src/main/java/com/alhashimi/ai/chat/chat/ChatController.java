package com.alhashimi.ai.chat.chat;

import com.alhashimi.ai.chat.auth.JwtPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final AiChatService      aiChatService;
    private final ConversationService conversationService;

    public ChatController(AiChatService aiChatService,
                          ConversationService conversationService) {
        this.aiChatService      = aiChatService;
        this.conversationService = conversationService;
    }

    /**
     * POST /api/chat/message
     * <p>
     * 1. Persists the user turn to the DB (also validates the conversation is owned by the caller).
     * 2. Calls the AI model with full history for context.
     * 3. Persists the assistant reply to the DB.
     * 4. Returns {@code { reply: "..." }}.
     */
    @PostMapping("/message")
    public ResponseEntity<?> sendMessage(
            @Valid @RequestBody ChatRequest request,
            @AuthenticationPrincipal JwtPrincipal principal) {

        UUID userId         = principal.userId();
        UUID conversationId = UUID.fromString(request.conversationId());

        // Persist the user turn — throws 404 if conversation not owned by this user
        conversationService.addMessage(userId, conversationId, "user", request.content());

        // Call the AI (stateless — uses history[] from the request body for context)
        String reply;
        try {
            reply = aiChatService.chat(request);
        } catch (Exception e) {
            // Persist a warning message so the UI shows it in the thread too
            String errorMsg = "⚠️ The AI service is unavailable. Make sure LM Studio is running on port 1234.";
            conversationService.addMessage(userId, conversationId, "assistant", errorMsg);
            return ResponseEntity.status(502)
                    .body(Map.of("error", "AI service unavailable: " + e.getMessage()));
        }

        // Persist the assistant reply
        conversationService.addMessage(userId, conversationId, "assistant", reply);

        return ResponseEntity.ok(new ChatResponse(reply));
    }
}
