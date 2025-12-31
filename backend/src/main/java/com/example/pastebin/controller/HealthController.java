package com.example.pastebin.controller;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api")
public class HealthController {

    private static final Logger log = LoggerFactory.getLogger(HealthController.class);

    private final StringRedisTemplate redis;

    public HealthController(StringRedisTemplate redis) {
        this.redis = redis;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        boolean redisUp = false;
        try {
            redisUp = redis.hasKey("health");
        } catch (Exception e) {
            log.warn("Redis health check failed", e);
            redisUp = false;
        }
        return Map.of(
                "ok", true,
                "redis", redisUp
        );
    }

    @GetMapping("/healthz")
    public Map<String, Object> healthz(HttpServletRequest request) {
        // Keep this lightweight and reuse the same Redis check
        boolean redisUp = false;
        try {
            redisUp = redis.hasKey("health");
        } catch (Exception e) {
            log.warn("Redis healthz check failed", e);
            redisUp = false;
        }
        return Map.of(
                "ok", true,
                "redis", redisUp
        );
    }
}
