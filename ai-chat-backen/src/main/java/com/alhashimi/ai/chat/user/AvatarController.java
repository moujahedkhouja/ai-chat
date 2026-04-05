package com.alhashimi.ai.chat.user;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class AvatarController {

    private final AvatarStorageService avatarStorageService;
    private final UserService userService;
    private final UserRepository userRepository;

    public AvatarController(AvatarStorageService avatarStorageService,
                            UserService userService,
                            UserRepository userRepository) {
        this.avatarStorageService = avatarStorageService;
        this.userService = userService;
        this.userRepository = userRepository;
    }

    @PostMapping("/{id}/avatar")
    @PreAuthorize("hasRole('ADMIN') or authentication.principal.userId.toString().equals(#id.toString())")
    public ResponseEntity<UserResponse> uploadAvatar(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) throws IOException {

        byte[] data = avatarStorageService.validate(file);
        String contentType = file.getContentType();

        UserResponse response = userService.updateAvatar(id, data, contentType);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/avatar")
    public ResponseEntity<byte[]> getAvatar(@PathVariable UUID id) {
        User user = userRepository.findById(id).orElse(null);

        if (user == null
                || user.getAvatarData() == null
                || user.getAvatarData().length == 0) {
            return ResponseEntity.notFound().build();
        }

        String contentType = user.getAvatarContentType() != null
                ? user.getAvatarContentType()
                : "application/octet-stream";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .header(HttpHeaders.CACHE_CONTROL, "no-cache")
                .contentType(MediaType.parseMediaType(contentType))
                .body(user.getAvatarData());
    }
}
