package com.alhashimi.ai.chat.chat;

import com.alhashimi.ai.chat.auth.JwtPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat/conversations")
public class ConversationController {

    private final ConversationService conversationService;

    public ConversationController(ConversationService conversationService) {
        this.conversationService = conversationService;
    }

    /** GET /api/chat/conversations — list all conversations for the current user (no messages). */
    @GetMapping
    public ResponseEntity<List<ConversationSummary>> list(
            @AuthenticationPrincipal JwtPrincipal principal) {
        return ResponseEntity.ok(conversationService.listConversations(principal.userId()));
    }

    /** GET /api/chat/conversations/{id} — fetch a single conversation with all messages. */
    @GetMapping("/{id}")
    public ResponseEntity<ConversationDetail> get(
            @PathVariable UUID id,
            @AuthenticationPrincipal JwtPrincipal principal) {
        return ResponseEntity.ok(conversationService.getConversation(principal.userId(), id));
    }

    /** POST /api/chat/conversations — create a new conversation with the greeting message. */
    @PostMapping
    public ResponseEntity<ConversationDetail> create(
            @AuthenticationPrincipal JwtPrincipal principal) {
        ConversationDetail detail = conversationService.createConversation(principal.userId());
        return ResponseEntity.status(HttpStatus.CREATED).body(detail);
    }

    /** DELETE /api/chat/conversations/{id} — delete a conversation (must be owned by caller). */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal JwtPrincipal principal) {
        conversationService.deleteConversation(principal.userId(), id);
        return ResponseEntity.noContent().build();
    }
}
