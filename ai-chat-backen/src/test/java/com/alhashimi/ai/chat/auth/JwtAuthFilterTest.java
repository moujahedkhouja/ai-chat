package com.alhashimi.ai.chat.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
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

    @InjectMocks
    private JwtAuthFilter jwtAuthFilter;

    private static final String VALID_TOKEN = "valid.jwt.token";
    private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void doFilterInternal_withValidToken_setsAuthentication() throws Exception {
        // Arrange
        when(tokenService.isTokenValid(VALID_TOKEN)).thenReturn(true);
        when(tokenService.extractUserId(VALID_TOKEN)).thenReturn(USER_ID);
        when(tokenService.extractUsername(VALID_TOKEN)).thenReturn("john");
        when(tokenService.extractRole(VALID_TOKEN)).thenReturn("ADMIN");
        when(tokenService.extractForcePasswordChange(VALID_TOKEN)).thenReturn(false);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + VALID_TOKEN);
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
        when(tokenService.isTokenValid("bad.token")).thenReturn(false);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer bad.token");
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
    void doFilterInternal_withForcePasswordChange_andNonChangePasswordPath_returns403() throws Exception {
        // Arrange
        when(tokenService.isTokenValid(VALID_TOKEN)).thenReturn(true);
        when(tokenService.extractUserId(VALID_TOKEN)).thenReturn(USER_ID);
        when(tokenService.extractUsername(VALID_TOKEN)).thenReturn("john");
        when(tokenService.extractRole(VALID_TOKEN)).thenReturn("USER");
        when(tokenService.extractForcePasswordChange(VALID_TOKEN)).thenReturn(true);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + VALID_TOKEN);
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
        String token = "valid.jwt.token";
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setMethod("POST");
        request.setServletPath("/api/auth/change-password");
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();

        when(tokenService.isTokenValid(token)).thenReturn(true);
        when(tokenService.extractUserId(token)).thenReturn(UUID.fromString("00000000-0000-0000-0000-000000000001"));
        when(tokenService.extractUsername(token)).thenReturn("john");
        when(tokenService.extractRole(token)).thenReturn("USER");
        when(tokenService.extractForcePasswordChange(token)).thenReturn(true);

        // Act
        jwtAuthFilter.doFilter(request, response, filterChain);

        // Assert: authentication was set and filter chain was invoked
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getName()).isEqualTo("john");
        assertThat(response.getStatus()).isEqualTo(200); // not 403
        assertThat(filterChain.getRequest()).isNotNull(); // filterChain.doFilter was called
    }
}
