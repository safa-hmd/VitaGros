package com.awd.paiement.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.*;
import lombok.*;

@Entity
@Table(name = "payment")
@Getter
@Setter
@NoArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String method;

    private Double amount;

    private LocalDateTime paidAt;

    // many-to-one : payment.invoice_id -> invoice.id
    @ManyToOne(optional = false)
    @JoinColumn(name = "invoice_id")
    @NotNull
    private Invoice invoice;
}
