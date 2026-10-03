package com.awd.livraison.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.*;
import lombok.*;

@Entity
@Table(name = "delivery")
@Getter
@Setter
@NoArgsConstructor
public class Delivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long orderId;

    @NotBlank
    private String address;

    @NotBlank
    private String status;

    // many-to-one : delivery.carrier_id -> carrier.id
    @ManyToOne(optional = false)
    @JoinColumn(name = "carrier_id")
    @NotNull
    private Carrier carrier;
}
