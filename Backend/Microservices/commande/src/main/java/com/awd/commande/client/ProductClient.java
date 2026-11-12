package com.awd.commande.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "produit")
public interface ProductClient {

    @GetMapping("/api/products/{id}")
    ProductResponse findById(@PathVariable("id") Long id);

    @PutMapping("/api/products/{id}")
    ProductResponse update(@PathVariable("id") Long id, @RequestBody ProductResponse product);
}
