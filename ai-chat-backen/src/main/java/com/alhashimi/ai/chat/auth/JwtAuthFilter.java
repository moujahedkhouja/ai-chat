package com.alhashimi.ai.chat.auth;

import tools.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    static final String CHANGE_PASSWORD_PATH = "/api/auth/change-password";

    private final TokenService tokenService;
    private final ObjectMapper objectMapper;

    public JwtAuthFilter(TokenService tokenService, ObjectMapper objectMapper) {
        this.tokenService = tokenService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        if (!tokenService.isTokenValid(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        UUID userId = tokenService.extractUserId(token);
        String username = tokenService.extractUsername(token);
        String role = tokenService.extractRole(token);
        boolean forcePasswordChange = tokenService.extractForcePasswordChange(token);

        // Enforce forcePasswordChange: block all requests except POST /api/auth/change-password
        if (forcePasswordChange) {
            String method = request.getMethod();
            String path = request.getServletPath();
            boolean isChangePasswordRequest = "POST".equals(method)
                    && CHANGE_PASSWORD_PATH.equals(path);

            if (!isChangePasswordRequest) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.getWriter().write(objectMapper.writeValueAsString(
                        Map.of("error", "Password change required")
                ));
                return;
            }
        }

        var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));
        var authentication = new UsernamePasswordAuthenticationToken(username, null, authorities);

        // Store forcePasswordChange and userId as details
        var details = new JwtAuthDetails(
                new WebAuthenticationDetailsSource().buildDetails(request),
                forcePasswordChange,
                userId
        );
        authentication.setDetails(details);

        SecurityContextHolder.getContext().setAuthentication(authentication);

        filterChain.doFilter(request, response);
    }
}
