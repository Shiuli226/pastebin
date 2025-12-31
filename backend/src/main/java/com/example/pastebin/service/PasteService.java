package com.example.pastebin.service;

import com.example.pastebin.dto.CreatePasteRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

import static org.springframework.http.HttpStatus.*;

@Service
public class PasteService {

    private final ConcurrentHashMap<String, PasteEntry> store = new ConcurrentHashMap<>();

    public Map<String, String> createPaste(CreatePasteRequest req, String baseUrl) {
        if (req == null || req.getContent() == null || req.getContent().trim().isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "content is required and must be non-empty");
        }
        if (req.getTtl_seconds() != null && req.getTtl_seconds() < 1) {
            throw new ResponseStatusException(BAD_REQUEST, "ttl_seconds must be >= 1");
        }
        if (req.getMax_views() != null && req.getMax_views() < 1) {
            throw new ResponseStatusException(BAD_REQUEST, "max_views must be >= 1");
        }

        String id = UUID.randomUUID().toString();
        long expiresAt = -1L;
        if (req.getTtl_seconds() != null) expiresAt = Instant.now().plusSeconds(req.getTtl_seconds()).toEpochMilli();
        int remainingViews = req.getMax_views() == null ? -1 : req.getMax_views();

        String safeContent = req.getContent().replaceAll("\\|", " ");
        String key = "paste:" + id;

        try {
            store.put(key, new PasteEntry(expiresAt, remainingViews, safeContent));
        } catch (Exception e) {
            throw new ResponseStatusException(SERVICE_UNAVAILABLE, "persistence unavailable");
        }

        String url = baseUrl + "/p/" + id;
        return Map.of("id", id, "url", url);
    }

    public Map<String, Object> fetchPaste(String id, Long testNow) {
        String key = "paste:" + id;
        long now = computeNow(testNow);

        final PasteEntry[] resultHolder = new PasteEntry[1];

        store.compute(key, (k, entry) -> {
            if (entry == null) {
                resultHolder[0] = null;
                return null;
            }
            if (entry.expiresAt != -1 && now > entry.expiresAt) {
                resultHolder[0] = null;
                return null;
            }
            if (entry.remainingViews != -1) {
                if (entry.remainingViews <= 0) {
                    resultHolder[0] = null;
                    return null;
                }
                int newRemaining = entry.remainingViews - 1;
                resultHolder[0] = new PasteEntry(entry.expiresAt, newRemaining, entry.content);
                if (newRemaining <= 0) return null;
                entry = new PasteEntry(entry.expiresAt, newRemaining, entry.content);
                return entry;
            } else {
                resultHolder[0] = new PasteEntry(entry.expiresAt, entry.remainingViews, entry.content);
                return entry;
            }
        });

        PasteEntry res = resultHolder[0];
        if (res == null) {
            throw new ResponseStatusException(NOT_FOUND, "paste not found or unavailable");
        }

        Map<String, Object> body = new HashMap<>();
        body.put("content", res.content);
        body.put("remaining_views", res.remainingViews == -1 ? null : res.remainingViews);
        body.put("expires_at", res.expiresAt == -1 ? null : DateTimeFormatter.ISO_INSTANT.format(Instant.ofEpochMilli(res.expiresAt)));
        return body;
    }

    public String fetchPasteContentForView(String id, Long testNow) {
        Map<String, Object> m = fetchPaste(id, testNow);
        return (String) m.get("content");
    }

    private long computeNow(Long testNow) {
        boolean testMode = "1".equals(System.getenv("TEST_MODE"));
        if (testMode && testNow != null) return testNow;
        return Instant.now().toEpochMilli();
    }

    private static class PasteEntry {
        final long expiresAt;
        final int remainingViews;
        final String content;

        PasteEntry(long expiresAt, int remainingViews, String content) {
            this.expiresAt = expiresAt;
            this.remainingViews = remainingViews;
            this.content = content;
        }
    }
}
