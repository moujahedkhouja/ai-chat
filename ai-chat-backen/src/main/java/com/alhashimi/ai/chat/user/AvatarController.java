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
        String relativePath = avatarStorageService.store(id, file);
        UserResponse response = userService.updateAvatar(id, relativePath);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/avatar")
    public ResponseEntity<Resource> getAvatar(@PathVariable UUID id) {
        UserResponse user = userService.getUser(id);

        if (user.profilePicturePath() == null) {
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
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        return "application/octet-stream";
    }
}
