package com.awd.user.controller;

import com.awd.user.entity.Role;
import com.awd.user.entity.User;
import com.awd.user.security.TokenService;
import com.awd.user.service.UserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/** Authentification : login (client ou admin) et inscription (toujours USER). */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth")
public class AuthController {

    private final UserService users;
    private final TokenService tokens;

    /** portal = espace demandé (USER ou ADMIN) ; le serveur refuse si le rôle ne correspond pas. */
    public record LoginRequest(@NotBlank String email, @NotBlank String password, Role portal) {}

    public record RegisterRequest(
            @NotBlank String firstname,
            @NotBlank String lastname,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6) String password) {}

    public record AuthResponse(String token, User user) {}

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest body) {
        User user = users.authenticate(body.email(), body.password());
        if (body.portal() != null && user.getRole() != body.portal()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    body.portal() == Role.ADMIN
                            ? "Accès réservé : ce compte ne possède pas les droits administrateur"
                            : "Ce compte est administrateur : utilisez la connexion administrateur");
        }
        return new AuthResponse(tokens.issue(user), user);
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest body) {
        User user = users.register(body.firstname(), body.lastname(), body.email(), body.password());
        return new AuthResponse(tokens.issue(user), user);
    }
}
