package com.alhashimi.ai.chat.chat;

import com.alhashimi.ai.chat.user.User;
import com.alhashimi.ai.chat.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ConversationService {

    private static final String GREETING =
            "Hello! I'm your AI assistant. How can I help you today?";

    private final ConversationRepository conversationRepository;
    private final MessageRepository      messageRepository;
    private final UserRepository         userRepository;

    public ConversationService(ConversationRepository conversationRepository,
                               MessageRepository messageRepository,
                               UserRepository userRepository) {
        this.conversationRepository = conversationRepository;
        this.messageRepository      = messageRepository;
        this.userRepository         = userRepository;
    }

    // ── List ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ConversationSummary> listConversations(UUID userId) {
        return conversationRepository.findByUserIdOrderByUpdatedAtDesc(userId)
                .stream()
                .map(ConversationSummary::from)
                .toList();
    }

    // ── Get detail ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ConversationDetail getConversation(UUID userId, UUID conversationId) {
        Conversation conv = findOwned(userId, conversationId);
        return ConversationDetail.from(conv);
    }

    // ── Create ──────────────────────────────────────────────────────────────

    public ConversationDetail createConversation(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Conversation conv = Conversation.builder()
                .user(user)
                .title("New Chat")
                .build();
        conv = conversationRepository.save(conv);

        // Seed the assistant greeting
        Message greeting = Message.builder()
                .conversation(conv)
                .role("assistant")
                .content(GREETING)
                .build();
        messageRepository.save(greeting);
        conv.getMessages().add(greeting);

        return ConversationDetail.from(conv);
    }

    // ── Add message ─────────────────────────────────────────────────────────

    public MessageDto addMessage(UUID userId, UUID conversationId, String role, String content) {
        Conversation conv = findOwned(userId, conversationId);

        Message msg = Message.builder()
                .conversation(conv)
                .role(role)
                .content(content)
                .build();
        msg = messageRepository.save(msg);

        // Auto-title from the first real user message
        if ("user".equals(role) && "New Chat".equals(conv.getTitle())) {
            conv.setTitle(content.length() > 40 ? content.substring(0, 40) + "…" : content);
        }

        // Bump updatedAt so ordering stays correct
        conv.setUpdatedAt(Instant.now());
        conversationRepository.save(conv);

        return MessageDto.from(msg);
    }

    // ── Delete ──────────────────────────────────────────────────────────────

    public void deleteConversation(UUID userId, UUID conversationId) {
        Conversation conv = findOwned(userId, conversationId);
        conversationRepository.delete(conv);
    }

    // ── Helper ──────────────────────────────────────────────────────────────

    private Conversation findOwned(UUID userId, UUID conversationId) {
        return conversationRepository.findByIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Conversation not found"));
    }
}
