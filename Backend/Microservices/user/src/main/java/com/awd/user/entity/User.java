package com.awd.user.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String firstname;

    @NotBlank
    private String lastname;

    @NotBlank
    @Column(nullable = false, unique = true)
    private String email;

    /**
     * Écriture seule : le mot de passe est accepté en entrée (inscription, modification)
     * mais n'est JAMAIS renvoyé dans les réponses JSON (liste, détail, login).
     * En base, il est stocké sous forme de hash BCrypt (voir UserService).
     */
    @NotBlank
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    @NotNull
    private Role role = Role.USER;
}
