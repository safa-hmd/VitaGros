package com.awd.paiement.client;

import feign.FeignException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class OrderClient {

    public record OrderDto(Long id, Long userId, String orderDate, String status) {}

    private final OrderFeignClient feign;

    public OrderClient(OrderFeignClient feign) {
        this.feign = feign;
    }

    public OrderDto get(Long id) {
        try {
            return feign.get(id);
        } catch (FeignException.NotFound e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order " + id + " not found");
        }
    }

    public void markPaid(Long id) {
        OrderDto o = get(id);
        feign.update(id, new OrderDto(o.id(), o.userId(), o.orderDate(), "CONFIRMEE"));
    }
}