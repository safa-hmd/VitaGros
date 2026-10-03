package com.awd.commande.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.*;
import lombok.*;

@Entity
@Table(name = "customer_order")
@Getter
@Setter
@NoArgsConstructor
public class CustomerOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private LocalDate orderDate;

    @NotBlank
    private String status;
}
