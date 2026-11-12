package com.awd.user.security;

import com.awd.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

/** Utilisé dans les expressions @PreAuthorize : "@userSecurity.isOwner(#id, authentication)". */
@Component("userSecurity")
@RequiredArgsConstructor
public class UserSecurity {

    private final UserRepository repository;

    /** true si l'utilisateur connecté est le propriétaire du compte {@code id}. */
    public boolean isOwner(Long id, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return false;
        return repository.findById(id)
                .map(u -> u.getEmail().equalsIgnoreCase(auth.getName()))
                .orElse(false);
    }
}
