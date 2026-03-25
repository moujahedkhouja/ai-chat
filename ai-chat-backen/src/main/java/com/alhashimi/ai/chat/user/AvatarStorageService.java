package com.alhashimi.ai.chat.user;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
public class AvatarStorageService {

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp"
    );

    private static final long MAX_FILE_SIZE = 5L * 1024 * 1024; // 5MB

    private final String avatarDir;

    public AvatarStorageService(@Value("${app.upload.avatar-dir}") String avatarDir) {
        this.avatarDir = avatarDir;
    }

    public String store(UUID userId, MultipartFile file) throws IOException {
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/") || !ALLOWED_MIME_TYPES.contains(contentType)) {
            throw new IllegalArgumentException(
                    "Invalid file type. Only image files are allowed (jpeg, png, gif, webp). Got: " + contentType);
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                    "File size exceeds 5MB limit. Actual size: " + file.getSize() + " bytes");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = getExtension(originalFilename, contentType);
        String filename = userId.toString() + "-" + System.currentTimeMillis() + "." + extension;

        Path uploadPath = Paths.get(avatarDir);
        Files.createDirectories(uploadPath);

        Path targetPath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        // Return relative path (strip leading "./" if present)
        String normalizedDir = avatarDir.startsWith("./") ? avatarDir.substring(2) : avatarDir;
        return normalizedDir + "/" + filename;
    }

    public void delete(String relativePath) throws IOException {
        Path filePath = getFilePath(relativePath);
        Files.deleteIfExists(filePath);
    }

    public Path getFilePath(String relativePath) {
        // If the relativePath is already absolute, return as-is
        Path path = Paths.get(relativePath);
        if (path.isAbsolute()) {
            return path;
        }
        // Otherwise resolve relative to the parent of avatarDir
        // The relative path looks like "uploads/avatars/uuid-timestamp.jpg"
        // avatarDir looks like "./uploads/avatars" or "/tmp/.../subdir"
        Path uploadPath = Paths.get(avatarDir);
        String filename = Paths.get(relativePath).getFileName().toString();
        return uploadPath.resolve(filename);
    }

    private String getExtension(String filename, String contentType) {
        if (filename != null && filename.contains(".")) {
            String ext = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
            if (!ext.isEmpty()) {
                return ext;
            }
        }
        return switch (contentType) {
            case "image/jpeg" -> "jpg";
            case "image/png" -> "png";
            case "image/gif" -> "gif";
            case "image/webp" -> "webp";
            default -> "jpg";
        };
    }
}
