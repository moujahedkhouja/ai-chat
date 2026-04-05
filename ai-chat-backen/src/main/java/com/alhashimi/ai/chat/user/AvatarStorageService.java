package com.alhashimi.ai.chat.user;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@Service
public class AvatarStorageService {

    private static final Map<String, String> MIME_TO_EXTENSION = Map.of(
            "image/jpeg", "jpg",
            "image/png",  "png",
            "image/gif",  "gif",
            "image/webp", "webp"
    );

    private static final long MAX_FILE_SIZE = 5L * 1024 * 1024; // 5 MB

    private final Path uploadDir;

    public AvatarStorageService(@Value("${app.upload.avatar-dir}") String avatarDir) {
        this.uploadDir = Paths.get(avatarDir).toAbsolutePath().normalize();
    }

    /**
     * Stores the uploaded file on disk and returns the relative filename
     * (e.g. "uuid-1712345678.png") that should be persisted in the database.
     */
    public String store(UUID userId, MultipartFile file) throws IOException {
        String contentType = file.getContentType();
        if (contentType == null || !MIME_TO_EXTENSION.containsKey(contentType)) {
            throw new IllegalArgumentException("Unsupported file type: " + contentType);
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                    "File size exceeds 5 MB limit. Actual: " + file.getSize() + " bytes");
        }

        String ext      = MIME_TO_EXTENSION.get(contentType);
        String filename = userId + "-" + System.currentTimeMillis() + "." + ext;

        Files.createDirectories(uploadDir);

        Path targetPath = uploadDir.resolve(filename);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        // Return only the filename — NOT the absolute path
        return filename;
    }

    /**
     * Deletes the file identified by its stored relative filename.
     * Silently succeeds if the file does not exist.
     */
    public void delete(String filename) throws IOException {
        if (filename == null || filename.isBlank()) return;
        Path filePath = resolveAndValidate(filename);
        Files.deleteIfExists(filePath);
    }

    /**
     * Resolves a stored relative filename to an absolute {@link Path},
     * with path-traversal protection.
     */
    public Path getFilePath(String filename) {
        return resolveAndValidate(filename);
    }

    // ── private ──────────────────────────────────────────────────────────

    private Path resolveAndValidate(String filename) {
        if (filename == null || filename.isBlank()) {
            throw new IllegalArgumentException("Filename must not be blank");
        }
        // Strip any leading directory components to prevent path traversal
        // regardless of what was stored (absolute or relative).
        String basename = Paths.get(filename).getFileName().toString();
        Path resolved = uploadDir.resolve(basename).normalize();

        if (!resolved.startsWith(uploadDir)) {
            throw new IllegalArgumentException("Invalid file path");
        }
        return resolved;
    }
}
