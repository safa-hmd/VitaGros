package com.awd.user.service;

import com.awd.user.entity.Role;
import com.awd.user.entity.User;
import com.awd.user.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository repository;

    public List<User> findAll() {
        return repository.findAll();
    }

    public User findById(Long id) {
        return repository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "User " + id + " not found"));
    }

    public User create(User e) {
        e.setId(null);
        requireFields(e, true);
        if (e.getRole() == null) e.setRole(Role.USER);
        normalize(e);
        ensureEmailFree(e.getEmail(), null);
        return repository.save(e);
    }

    /**
     * Mise à jour : si le mot de passe n'est pas fourni, on conserve l'actuel.
     * Le rôle n'est modifiable que si l'appelant le fournit explicitement.
     */
    public User update(Long id, User e) {
        User current = findById(id);
        requireFields(e, false);
        if (blank(e.getPassword())) e.setPassword(current.getPassword());
        if (e.getRole() == null) e.setRole(current.getRole());
        normalize(e);
        ensureEmailFree(e.getEmail(), id);
        e.setId(id);
        return repository.save(e);
    }

    public void delete(Long id) {
        findById(id);
        repository.deleteById(id);
    }

    /** Vérifie email + mot de passe ; renvoie l'utilisateur ou une 401 générique. */
    public User authenticate(String email, String password) {
        User user = repository.findFirstByEmailIgnoreCase(email == null ? "" : email.trim())
                .orElseThrow(this::invalidCredentials);
        if (password == null || !password.equals(user.getPassword())) {
            throw invalidCredentials();
        }
        return user;
    }

    /** Inscription publique : le rôle est TOUJOURS USER (pas d'auto-promotion admin). */
    public User register(String firstname, String lastname, String email, String password) {
        User user = new User();
        user.setFirstname(firstname);
        user.setLastname(lastname);
        user.setEmail(email);
        user.setPassword(password);
        user.setRole(Role.USER);
        return create(user);
    }

    private ResponseStatusException invalidCredentials() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email ou mot de passe incorrect");
    }

    private void requireFields(User e, boolean creating) {
        if (blank(e.getFirstname()) || blank(e.getLastname()) || blank(e.getEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Prénom, nom et email sont obligatoires");
        }
        if (creating && blank(e.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le mot de passe est obligatoire");
        }
    }

    private void normalize(User e) {
        e.setFirstname(e.getFirstname().trim());
        e.setLastname(e.getLastname().trim());
        e.setEmail(e.getEmail().trim().toLowerCase());
    }

    private void ensureEmailFree(String email, Long ownId) {
        repository.findFirstByEmailIgnoreCase(email)
                .filter(other -> !other.getId().equals(ownId))
                .ifPresent(other -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Cet email est déjà utilisé");
                });
    }

    private static boolean blank(String s) {
        return s == null || s.isBlank();
    }
}
