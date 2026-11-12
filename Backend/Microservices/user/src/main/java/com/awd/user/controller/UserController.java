package com.awd.user.controller;

import com.awd.user.entity.User;
import com.awd.user.service.UserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User")
public class UserController {

    private final UserService service;

    /** Liste complète : ADMIN seulement. */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<User> list() {
        return service.findAll();
    }

    /** Détail : ADMIN, ou l'utilisateur lui-même. */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @userSecurity.isOwner(#id, authentication)")
    public User get(@PathVariable Long id) {
        return service.findById(id);
    }

    /** Création par un admin (rôle libre). L'inscription publique passe par /api/auth/register. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public User create(@Valid @RequestBody User body) {
        return service.create(body);
    }

    /**
     * ADMIN, ou l'utilisateur lui-même. Un non-admin ne peut PAS changer son rôle :
     * on l'ignore (le service garde alors le rôle actuel).
     * Pas de @Valid : le mot de passe est facultatif lors d'une mise à jour.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @userSecurity.isOwner(#id, authentication)")
    public User update(@PathVariable Long id, @RequestBody User body, Authentication auth) {
        boolean admin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!admin) {
            body.setRole(null);
        }
        return service.update(id, body);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
