
package com.awd.livraison.client;

import com.awd.livraison.dto.OrderDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "commande")
public interface CommandeClient {

    @GetMapping("/api/orders/{id}")
    OrderDTO getOrderById(@PathVariable("id") Long id);
}
