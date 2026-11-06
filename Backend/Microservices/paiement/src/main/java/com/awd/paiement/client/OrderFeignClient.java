package com.awd.paiement.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient(name = "commande")
public interface OrderFeignClient {

    @GetMapping("/api/orders/{id}")
    OrderClient.OrderDto get(@PathVariable("id") Long id);

    @PutMapping("/api/orders/{id}")
    OrderClient.OrderDto update(@PathVariable("id") Long id, @RequestBody OrderClient.OrderDto body);
}