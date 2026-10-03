package com.awd.commande.controller;

import com.awd.commande.entity.CustomerOrder;
import com.awd.commande.service.CustomerOrderService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "CustomerOrder")
public class CustomerOrderController {

    private final CustomerOrderService service;

    @GetMapping
    public List<CustomerOrder> list() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public CustomerOrder get(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CustomerOrder create(@Valid @RequestBody CustomerOrder body) {
        return service.create(body);
    }

    @PutMapping("/{id}")
    public CustomerOrder update(@PathVariable Long id, @Valid @RequestBody CustomerOrder body) {
        return service.update(id, body);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
