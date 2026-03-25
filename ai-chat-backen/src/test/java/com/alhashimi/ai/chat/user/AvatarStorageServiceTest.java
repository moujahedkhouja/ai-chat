package com.alhashimi.ai.chat.user;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AvatarStorageServiceTest {

    @TempDir
    Path tempDir;

    private AvatarStorageService avatarStorageService;

    @BeforeEach
    void setUp() {
        avatarStorageService = new AvatarStorageService(tempDir.toString());
    }

    @Test
    void store_withValidJpegFile_returnsRelativePath() throws IOException {
        UUID userId = UUID.randomUUID();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "avatar.jpg",
                "image/jpeg",
                "fake-jpeg-content".getBytes()
        );

        String relativePath = avatarStorageService.store(userId, file);

        assertThat(relativePath).contains(userId.toString());
        assertThat(relativePath).endsWith(".jpg");
    }

    @Test
    void store_withInvalidMimeType_throwsIllegalArgumentException() {
        UUID userId = UUID.randomUUID();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "malicious.exe",
                "application/octet-stream",
                "fake-binary-content".getBytes()
        );

        assertThatThrownBy(() -> avatarStorageService.store(userId, file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported file type");
    }

    @Test
    void store_createsDirectoryIfNotExists() throws IOException {
        Path subDir = tempDir.resolve("new-subdir/avatars");
        AvatarStorageService serviceWithSubDir = new AvatarStorageService(subDir.toString());

        UUID userId = UUID.randomUUID();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "avatar.png",
                "image/png",
                "fake-png-content".getBytes()
        );

        serviceWithSubDir.store(userId, file);

        assertThat(subDir).isDirectory();
    }

    @Test
    void store_withExistingFile_replacesIt() throws IOException {
        UUID userId = UUID.randomUUID();
        MockMultipartFile firstFile = new MockMultipartFile(
                "file",
                "avatar.jpg",
                "image/jpeg",
                "original-content".getBytes()
        );
        MockMultipartFile secondFile = new MockMultipartFile(
                "file",
                "avatar.jpg",
                "image/jpeg",
                "updated-content".getBytes()
        );

        String firstPath = avatarStorageService.store(userId, firstFile);
        String secondPath = avatarStorageService.store(userId, secondFile);

        Path resolvedPath = avatarStorageService.getFilePath(secondPath);
        assertThat(Files.readString(resolvedPath)).isEqualTo("updated-content");
    }

    @Test
    void delete_removesFileFromDisk() throws IOException {
        UUID userId = UUID.randomUUID();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "avatar.webp",
                "image/webp",
                "fake-webp-content".getBytes()
        );

        String relativePath = avatarStorageService.store(userId, file);
        Path storedPath = avatarStorageService.getFilePath(relativePath);
        assertThat(storedPath).exists();

        avatarStorageService.delete(relativePath);

        assertThat(storedPath).doesNotExist();
    }
}
