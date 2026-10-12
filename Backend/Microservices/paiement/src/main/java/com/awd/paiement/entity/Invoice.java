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

    @NotNull
    private Long orderId;

    private Long userId;

    @NotNull
    @Positive
    private Double amount;

    private LocalDate issueDate;

    @Enumerated(EnumType.STRING)
    private InvoiceStatus status = InvoiceStatus.UNPAID;

    @PrePersist
    void onCreate() {
        if (issueDate == null) issueDate = LocalDate.now();
        if (status == null) status = InvoiceStatus.UNPAID;
    }
}