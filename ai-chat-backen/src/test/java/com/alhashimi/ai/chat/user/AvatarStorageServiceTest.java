package com.alhashimi.ai.chat.user;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AvatarStorageServiceTest {

    private AvatarStorageService avatarStorageService;

    @BeforeEach
    void setUp() {
        avatarStorageService = new AvatarStorageService();
    }

    @Test
    void validate_withValidJpegFile_returnsBytesMatchingInput() throws IOException {
        byte[] content = "fake-jpeg-content".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "avatar.jpg",
                "image/jpeg",
                content
        );

        byte[] result = avatarStorageService.validate(file);

        assertThat(result).isEqualTo(content);
    }

    @Test
    void validate_withValidPngFile_returnsBytesMatchingInput() throws IOException {
        byte[] content = "fake-png-content".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "avatar.png",
                "image/png",
                content
        );

        byte[] result = avatarStorageService.validate(file);

        assertThat(result).isEqualTo(content);
    }

    @Test
    void validate_withInvalidMimeType_throwsIllegalArgumentException() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "malicious.exe",
                "application/octet-stream",
                "fake-binary-content".getBytes()
        );

        assertThatThrownBy(() -> avatarStorageService.validate(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported file type");
    }

    @Test
    void validate_withNullContentType_throwsIllegalArgumentException() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "avatar.jpg",
                null,
                "some-content".getBytes()
        );

        assertThatThrownBy(() -> avatarStorageService.validate(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported file type");
    }

    @Test
    void validate_withFileThatExceedsMaxSize_throwsIllegalArgumentException() {
        byte[] oversizedContent = new byte[6 * 1024 * 1024]; // 6 MB
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "big.png",
                "image/png",
                oversizedContent
        );

        assertThatThrownBy(() -> avatarStorageService.validate(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("5 MB");
    }

    @Test
    void validate_withWebpFile_returnsBytesMatchingInput() throws IOException {
        byte[] content = "fake-webp-content".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "avatar.webp",
                "image/webp",
                content
        );

        byte[] result = avatarStorageService.validate(file);

        assertThat(result).isEqualTo(content);
    }
}
