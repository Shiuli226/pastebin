package com.example.pastebin.controller;

import com.example.pastebin.dto.CreatePasteRequest;
import com.example.pastebin.service.PasteService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

import static org.springframework.http.HttpStatus.*;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/paste")
public class PasteController {

    private final PasteService pasteService;

    public PasteController(PasteService pasteService) {
        this.pasteService = pasteService;
    }

    // POST /api/pastes
    @PostMapping(path = "/api/pastes", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, String>> createPaste(@RequestBody CreatePasteRequest req, HttpServletRequest request) {
        String base = getBaseUrl(request);
        Map<String, String> res = pasteService.createPaste(req, base);
        return ResponseEntity.created(null).body(res);
    }

    @GetMapping(path = "/api/pastes/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> getPaste(@PathVariable String id, @RequestHeader(required = false, name = "x-test-now-ms") Long testNow) {
        Map<String, Object> body = pasteService.fetchPaste(id, testNow);
        return ResponseEntity.ok(body);
    }

    @GetMapping(path = "/p/{id}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> viewPaste(@PathVariable String id, @RequestHeader(required = false, name = "x-test-now-ms") Long testNow) {
        String content = pasteService.fetchPasteContentForView(id, testNow);
        if (content == null) return ResponseEntity.status(NOT_FOUND).body("<h1>404 Not found</h1>");
        String escaped = htmlEscape(content);
        String html = "<!doctype html><html><head><meta charset=\"utf-8\"></head><body><pre>" + escaped + "</pre></body></html>";
        return ResponseEntity.ok(html);
    }

    private String getBaseUrl(HttpServletRequest request) {
        String host = request.getHeader("x-forwarded-host");
        if (host == null) host = request.getHeader("host");
        if (host == null) host = "localhost:8080";
        String scheme = request.getHeader("x-forwarded-proto");
        if (scheme == null) scheme = request.getScheme();
        return scheme + "://" + host;
    }

    private String htmlEscape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&#39;");
    }
}
