package com.alhashimi.ai.chat.user;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Set;

/**
 * Validates avatar uploads before they are persisted as binary data in the database.
 * All file I/O has been removed — the raw bytes are stored directly on the {@code User} entity.
 */
@Service
public class AvatarStorageService {

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp"
    );

    private static final long MAX_FILE_SIZE = 5L * 1024 * 1024; // 5 MB

    /**
     * Validates the uploaded file and returns its raw bytes.
     *
     * @throws IllegalArgumentException if the MIME type is not allowed or the file exceeds 5 MB
     * @throws IOException              if the file bytes cannot be read
     */
    public byte[] validate(MultipartFile file) throws IOException {
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Unsupported file type: " + contentType);
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                    "File size exceeds 5 MB limit. Actual: " + file.getSize() + " bytes");
        }

        return file.getBytes();
    }
}
