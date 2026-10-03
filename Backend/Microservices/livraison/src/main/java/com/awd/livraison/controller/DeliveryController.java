package com.awd.livraison.controller;

import com.awd.livraison.entity.Delivery;
import com.awd.livraison.service.DeliveryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/deliveries")
@RequiredArgsConstructor
@Tag(name = "Delivery")
public class DeliveryController {

    private final DeliveryService service;

    @GetMapping
    public List<Delivery> list() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Delivery get(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Delivery create(@Valid @RequestBody Delivery body) {
        return service.create(body);
    }

    @PutMapping("/{id}")
    public Delivery update(@PathVariable Long id, @Valid @RequestBody Delivery body) {
        return service.update(id, body);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
