package com.awd.commande.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.*;
import lombok.*;

@Entity
@Table(name = "order_line")
@Getter
@Setter
@NoArgsConstructor
public class OrderLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long productId;

    private Integer quantity;

    private Double unitPrice;

    // many-to-one : order_line.customerOrder_id -> customer_order.id
    @ManyToOne(optional = false)
    @JoinColumn(name = "customerOrder_id")
    @NotNull
    private CustomerOrder customerOrder;
}
