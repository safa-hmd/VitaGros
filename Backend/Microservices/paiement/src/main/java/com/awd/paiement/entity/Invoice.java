package com.awd.paiement.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.*;
import lombok.*;

@Entity
@Table(name = "invoice")
@Getter
@Setter
@NoArgsConstructor
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long orderId;

    private Double amount;

    private LocalDate issueDate;
}
