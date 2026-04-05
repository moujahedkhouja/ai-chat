package com.alhashimi.ai.chat.chat;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final AiChatService aiChatService;

    public ChatController(AiChatService aiChatService) {
        this.aiChatService = aiChatService;
    }

    /**
     * POST /api/chat/message
     * Authenticated endpoint (all roles). Proxies the request to LM Studio via Spring AI.
     */
    @PostMapping("/message")
    public ResponseEntity<?> sendMessage(@Valid @RequestBody ChatRequest request) {
        try {
            String reply = aiChatService.chat(request);
            return ResponseEntity.ok(new ChatResponse(reply));
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "AI service unavailable: " + e.getMessage()));
        }
    }
}

