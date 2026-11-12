package com.awd.commande.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ProductResponse(Long id, String name, Double price, Integer stock, CategoryResponse category) {
}
