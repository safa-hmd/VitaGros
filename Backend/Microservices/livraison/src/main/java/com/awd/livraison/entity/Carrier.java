package com.awd.livraison.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.*;
import lombok.*;

@Entity
@Table(name = "carrier")
@Getter
@Setter
@NoArgsConstructor
public class Carrier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String name;

    @NotBlank
    private String phone;
}
