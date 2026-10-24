package com.awd.paiement.client;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.*;
import org.springframework.web.server.ResponseStatusException;

@Component
public class OrderClient {

    public record OrderDto(Long id, Long userId, String orderDate, String status) {}
    private final RestClient http;

    public OrderClient(RestClient.Builder builder) {
        this.http = builder.baseUrl("http://commande").build();
    }

    public OrderDto get(Long id) {
        try {
            return http.get().uri("/api/orders/{id}", id).retrieve().body(OrderDto.class);
        } catch (HttpClientErrorException.NotFound e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order " + id + " not found");
        }
    }
    public void markPaid(Long id) {
        OrderDto o = get(id);
        http.put().uri("/api/orders/{id}", id)
                .body(new OrderDto(o.id(), o.userId(), o.orderDate(), "PAID"))
                .retrieve().toBodilessEntity();
    }
}