package com.alhashimi.ai.chat.user;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class AvatarController {

    private final AvatarStorageService avatarStorageService;
    private final UserService userService;

    public AvatarController(AvatarStorageService avatarStorageService, UserService userService) {
        this.avatarStorageService = avatarStorageService;
        this.userService = userService;
    }

    @PostMapping("/{id}/avatar")
    @PreAuthorize("hasRole('ADMIN') or authentication.principal.userId.toString().equals(#id.toString())")
    public ResponseEntity<UserResponse> uploadAvatar(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) throws IOException {

        // Capture the old path before overwriting so we can delete the old file
        UserResponse existing = userService.getUser(id);
        String oldPath = existing.profilePicturePath();

        // Store the new file — returns a relative filename
        String newFilename = avatarStorageService.store(id, file);

        // Persist the new path in the database
        UserResponse response = userService.updateAvatar(id, newFilename);

        // Delete the previous file only after the DB update succeeded
        if (oldPath != null && !oldPath.isBlank()) {
            try {
                avatarStorageService.delete(oldPath);
            } catch (IOException e) {
                // Log but don't fail the request — the DB is already consistent
                System.err.println("Warning: could not delete old avatar file: " + oldPath + " — " + e.getMessage());
            }
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/avatar")
    public ResponseEntity<Resource> getAvatar(@PathVariable UUID id) {
        UserResponse user = userService.getUser(id);

        if (user.profilePicturePath() == null || user.profilePicturePath().isBlank()) {
            return ResponseEntity.notFound().build();
        }

        Path filePath = avatarStorageService.getFilePath(user.profilePicturePath());

        try {
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = determineContentType(filePath.getFileName().toString());

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + resource.getFilename() + "\"")
                    .header(HttpHeaders.CACHE_CONTROL, "max-age=31536000, immutable")
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(resource);
        } catch (MalformedURLException e) {
            return ResponseEntity.notFound().build();
        }
    }

    private String determineContentType(String filename) {
        if (filename == null) return "application/octet-stream";
        String lower = filename.toLowerCase();
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".png"))  return "image/png";
        if (lower.endsWith(".gif"))  return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        return "application/octet-stream";
    }
}
