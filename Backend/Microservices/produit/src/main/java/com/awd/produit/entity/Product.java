package com.awd.produit.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.*;
import lombok.*;

@Entity
@Table(name = "product")
@Getter
@Setter
@NoArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String name;

    private Double price;

    private Integer stock;

    // many-to-one : product.category_id -> category.id
    @ManyToOne(optional = false)
    @JoinColumn(name = "category_id")
    @NotNull
    private Category category;
}
