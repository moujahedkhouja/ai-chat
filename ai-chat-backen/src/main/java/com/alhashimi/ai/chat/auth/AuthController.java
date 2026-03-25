package com.alhashimi.ai.chat.auth;

import com.alhashimi.ai.chat.user.User;
import com.alhashimi.ai.chat.user.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@Validated
public class AuthController {

    private static final String INVALID_CREDENTIALS_ERROR = "Invalid username or password";
    private static final String WRONG_CURRENT_PASSWORD_ERROR = "Current password is incorrect";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          TokenService tokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request,
                                   HttpServletResponse httpResponse) {
        User user = userRepository.findByUsername(request.username()).orElse(null);

        if (user == null || !user.isEnabled()) {
            return ResponseEntity.status(401).body(Map.of("error", INVALID_CREDENTIALS_ERROR));
        }

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("error", INVALID_CREDENTIALS_ERROR));
        }

        String token = tokenService.generateToken(user);
        ResponseCookie cookie = buildAuthCookie(token, 86400);
        httpResponse.addHeader("Set-Cookie", cookie.toString());

        return ResponseEntity.ok(new AuthResponse(
            user.getId().toString(),
            user.getUsername(),
            user.getRole().name(),
            user.isForcePasswordChange()
        ));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest request,
                                            HttpServletResponse httpResponse,
                                            Authentication authentication) {
        if (!(authentication != null && authentication.getDetails() instanceof JwtAuthDetails details)) {
            return ResponseEntity.status(401).body(Map.of("error", INVALID_CREDENTIALS_ERROR));
        }
        UUID userId = details.getUserId();

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", WRONG_CURRENT_PASSWORD_ERROR));
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        user.setForcePasswordChange(false);
        userRepository.save(user);

        String token = tokenService.generateToken(user);
        ResponseCookie cookie = buildAuthCookie(token, 86400);
        httpResponse.addHeader("Set-Cookie", cookie.toString());

        return ResponseEntity.ok(new AuthResponse(
            user.getId().toString(),
            user.getUsername(),
            user.getRole().name(),
            false
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse httpResponse) {
        ResponseCookie cookie = buildAuthCookie("", 0);
        httpResponse.addHeader("Set-Cookie", cookie.toString());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal Authentication authentication) {
        if (!(authentication != null && authentication.getDetails() instanceof JwtAuthDetails details)) {
            return ResponseEntity.status(401).body(Map.of("error", INVALID_CREDENTIALS_ERROR));
        }

        UUID userId = details.getUserId();
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        return ResponseEntity.ok(new AuthResponse(
            user.getId().toString(),
            user.getUsername(),
            user.getRole().name(),
            user.isForcePasswordChange()
        ));
    }

    private ResponseCookie buildAuthCookie(String token, int maxAge) {
        return ResponseCookie.from("auth_token", token)
            .httpOnly(true)
            .secure(false) // set true in production profile; false allows dev over HTTP
            .sameSite("Strict")
            .path("/")
            .maxAge(maxAge)
            .build();
    }
}
