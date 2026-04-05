package com.alhashimi.ai.chat.chat;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AiChatService {

    private static final String SYSTEM_PROMPT =
            "You are a helpful, concise AI assistant. " +
            "Answer clearly and accurately. " +
            "Use markdown formatting when it aids readability.";

    private final ChatClient chatClient;

    public AiChatService(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    /**
     * Sends the user's message along with prior conversation history to the LLM
     * and returns the assistant's reply.
     */
    public String chat(ChatRequest request) {
        List<Message> messages = new ArrayList<>();
        messages.add(new SystemMessage(SYSTEM_PROMPT));

        // Replay conversation history for context
        if (request.history() != null) {
            for (ChatRequest.ChatMessage msg : request.history()) {
                if ("assistant".equalsIgnoreCase(msg.role())) {
                    messages.add(new AssistantMessage(msg.content()));
                } else {
                    messages.add(new UserMessage(msg.content()));
                }
            }
        }

        // Add the current user turn
        messages.add(new UserMessage(request.content()));

        Prompt prompt = new Prompt(messages);
        return chatClient.prompt(prompt)
                .call()
                .content();
    }
}

