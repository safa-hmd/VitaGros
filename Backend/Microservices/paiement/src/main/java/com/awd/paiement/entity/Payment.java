package com.awd.paiement.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.*;
import java.util.UUID;
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

    @NotNull
    @Positive
    private Double amount;

    private LocalDateTime paidAt;

    @Enumerated(EnumType.STRING)
    private PaymentStatus status = PaymentStatus.PENDING;

    private String transactionRef;

    @ManyToOne(optional = false)
    @JoinColumn(name = "invoice_id")
    @NotNull
    private Invoice invoice;

    @PrePersist
    void onCreate() {
        if (paidAt == null) paidAt = LocalDateTime.now();
        if (status == null) status = PaymentStatus.PENDING;
        if (transactionRef == null) transactionRef = "TX-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}