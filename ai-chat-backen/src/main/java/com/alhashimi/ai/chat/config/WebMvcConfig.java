package com.alhashimi.ai.chat.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    /**
     * Serve uploaded avatar files from the filesystem directory ./uploads/
     * mapped to /uploads/** URL path.
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:./uploads/");
    }

    /**
     * SPA fallback controller — forwards Angular routes to /index.html.
     *
     * The regex [^\\.]*  matches path segments that contain no dot, so:
     *   /users          → forward to index.html  (Angular route)
     *   /profile        → forward to index.html  (Angular route)
     *   /login          → forward to index.html  (Angular route)
     *   /main.js        → NOT matched (has a dot) → served as static file
     *   /api/users      → NOT matched (explicit /api prefix exclusion via regex)
     *   /uploads/a.png  → NOT matched (has a dot) → served as static file
     *
     * /api/** and /uploads/** are handled by controllers / resource handlers
     * before reaching this fallback.
     */
    @Controller
    static class SpaController {

        @RequestMapping(value = {
            "/",
            "/{path:[^\\.]*}",
            "/{path1:[^\\.]*}/{path2:[^\\.]*}",
            "/{path1:[^\\.]*}/{path2:[^\\.]*}/{path3:[^\\.]*}"
        })
        public String spa() {
            return "forward:/index.html";
        }
    }

    /**
     * Dev-only CORS configuration.
     *
     * Active only when the "dev" Spring profile is enabled.
     * Allows the Angular dev server (http://localhost:4200) to call the API.
     * In production, Angular is served from the same origin so no CORS is needed.
     */
    @Configuration
    @Profile("dev")
    static class DevCorsConfig implements WebMvcConfigurer {

        @Override
        public void addCorsMappings(CorsRegistry registry) {
            registry.addMapping("/api/**")
                    .allowedOrigins("http://localhost:4200")
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                    .allowedHeaders("*")
                    .allowCredentials(false)
                    .maxAge(3600);
        }
    }
}
