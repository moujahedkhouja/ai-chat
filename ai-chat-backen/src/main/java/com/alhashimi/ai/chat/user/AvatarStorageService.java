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

    private static final long MAX_FILE_SIZE = 5L * 1024 * 1024; // 5MB

    private final Path uploadDir;

    public AvatarStorageService(@Value("${app.upload.avatar-dir}") String avatarDir) {
        this.uploadDir = Paths.get(avatarDir).toAbsolutePath().normalize();
    }

    public String store(UUID userId, MultipartFile file) throws IOException {
        String contentType = file.getContentType();
        if (contentType == null || !MIME_TO_EXTENSION.containsKey(contentType)) {
            throw new IllegalArgumentException("Unsupported file type: " + contentType);
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                    "File size exceeds 5MB limit. Actual size: " + file.getSize() + " bytes");
        }

        String ext = MIME_TO_EXTENSION.get(contentType);
        String filename = userId.toString() + "-" + System.currentTimeMillis() + "." + ext;

        Files.createDirectories(uploadDir);

        Path targetPath = uploadDir.resolve(filename);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        return uploadDir + "/" + filename;
    }

    public void delete(String relativePath) throws IOException {
        Path filePath = getFilePath(relativePath);
        Files.deleteIfExists(filePath);
    }

    public Path getFilePath(String relativePath) {
        Path resolved = uploadDir.resolve(relativePath).normalize();
        // Prevent path traversal
        if (!resolved.startsWith(uploadDir.normalize())) {
            throw new IllegalArgumentException("Invalid file path");
        }
        return resolved;
    }
}
