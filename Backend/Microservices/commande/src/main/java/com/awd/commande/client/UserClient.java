package com.awd.commande.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "user", configuration = UserClientConfiguration.class)
public interface UserClient {

    @GetMapping("/api/users/{id}")
    UserResponse findById(@PathVariable("id") Long id);
}
