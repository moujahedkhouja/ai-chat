package com.alhashimi.ai.chat.auth;

import tools.jackson.databind.ObjectMapper;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtAuthFilterTest {

    @Mock
    private TokenService tokenService;

    @Spy
    private ObjectMapper objectMapper;

    private JwtAuthFilter jwtAuthFilter;

    private static final String VALID_TOKEN = "valid.jwt.token";
    private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @BeforeEach
    void setUp() {
        jwtAuthFilter = new JwtAuthFilter(tokenService, objectMapper);
        SecurityContextHolder.clearContext();
    }

    @Test
    void doFilterInternal_withValidToken_setsAuthentication() throws Exception {
        // Arrange
        when(tokenService.extractAll(VALID_TOKEN))
                .thenReturn(new TokenClaims(USER_ID, "john", "ADMIN", false));

        MockHttpServletRequest request = new MockHttpServletRequest();
        Cookie cookie = new Cookie("auth_token", VALID_TOKEN);
        request.setCookies(cookie);
        request.setMethod("GET");
        request.setServletPath("/api/some-endpoint");

        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();

        // Act
        jwtAuthFilter.doFilter(request, response, filterChain);

        // Assert
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getName()).isEqualTo("john");
        assertThat(auth.getAuthorities())
                .extracting(a -> a.getAuthority())
                .containsExactly("ROLE_ADMIN");
        assertThat(response.getStatus()).isEqualTo(200);
    }

    @Test
    void doFilterInternal_withInvalidToken_doesNotSetAuthentication() throws Exception {
        // Arrange
        when(tokenService.extractAll("bad.token"))
                .thenThrow(new JwtException("invalid"));

        MockHttpServletRequest request = new MockHttpServletRequest();
        Cookie cookie = new Cookie("auth_token", "bad.token");
        request.setCookies(cookie);
        request.setMethod("GET");
        request.setServletPath("/api/some-endpoint");

        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();

        // Act
        jwtAuthFilter.doFilter(request, response, filterChain);

        // Assert
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNull();
        // Filter chain should have been called (let Security reject it)
        assertThat(filterChain.getRequest()).isNotNull();
    }

    @Test
    void doFilterInternal_withNoCookie_doesNotSetAuthentication() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setMethod("GET");
        request.setServletPath("/api/some-endpoint");

        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();

        // Act
        jwtAuthFilter.doFilter(request, response, filterChain);

        // Assert
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNull();
        assertThat(filterChain.getRequest()).isNotNull();
    }

    @Test
    void doFilterInternal_withForcePasswordChange_andNonChangePasswordPath_returns403() throws Exception {
        // Arrange
        when(tokenService.extractAll(VALID_TOKEN))
                .thenReturn(new TokenClaims(USER_ID, "john", "USER", true));

        MockHttpServletRequest request = new MockHttpServletRequest();
        Cookie cookie = new Cookie("auth_token", VALID_TOKEN);
        request.setCookies(cookie);
        request.setMethod("GET");
        request.setServletPath("/api/chat");

        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();

        // Act
        jwtAuthFilter.doFilter(request, response, filterChain);

        // Assert
        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentAsString()).contains("Password change required");
        // Filter chain must NOT have been called
        assertThat(filterChain.getRequest()).isNull();
    }

    @Test
    void doFilterInternal_withForcePasswordChange_andChangePasswordPath_setsAuthAndProceeds() throws Exception {
        // Arrange: valid token with forcePasswordChange=true
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setMethod("POST");
        request.setServletPath(JwtAuthFilter.CHANGE_PASSWORD_PATH);
        Cookie cookie = new Cookie("auth_token", VALID_TOKEN);
        request.setCookies(cookie);
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();

        when(tokenService.extractAll(VALID_TOKEN))
                .thenReturn(new TokenClaims(USER_ID, "john", "USER", true));

        // Act
        jwtAuthFilter.doFilter(request, response, filterChain);

        // Assert: authentication was set and filter chain was invoked
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getName()).isEqualTo("john");
        assertThat(response.getStatus()).isEqualTo(200); // not 403
        assertThat(filterChain.getRequest()).isNotNull(); // filterChain.doFilter was called
    }
}
