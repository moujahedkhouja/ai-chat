package com.alhashimi.ai.chat.user;

import com.alhashimi.ai.chat.auth.JwtPrincipal;
import com.alhashimi.ai.chat.auth.TokenService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final UserService userService;
    private final TokenService tokenService;
    private final boolean cookieSecure;

    public ProfileController(UserService userService,
                             TokenService tokenService,
                             @Value("${app.cookie.secure:false}") boolean cookieSecure) {
        this.userService = userService;
        this.tokenService = tokenService;
        this.cookieSecure = cookieSecure;
    }

    @GetMapping
    public ResponseEntity<UserResponse> getProfile(
            @AuthenticationPrincipal JwtPrincipal principal) {
        return ResponseEntity.ok(userService.getUser(principal.userId()));
    }

    @PutMapping
    public ResponseEntity<UserResponse> updateProfile(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody UpdateProfileRequest request,
            HttpServletResponse httpResponse) {
        UserResponse updated = userService.updateProfile(principal.userId(), request);

        // Re-issue JWT so token stays current after username change
        User user = userService.getRawUser(principal.userId());
        String token = tokenService.generateToken(user);
        ResponseCookie cookie = ResponseCookie.from("auth_token", token)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Strict")
                .path("/")
                .maxAge(86400)
                .build();
        httpResponse.addHeader("Set-Cookie", cookie.toString());

        return ResponseEntity.ok(updated);
    }
}
