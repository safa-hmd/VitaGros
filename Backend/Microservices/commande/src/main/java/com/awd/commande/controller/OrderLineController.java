package com.awd.commande.controller;

import com.awd.commande.entity.OrderLine;
import com.awd.commande.service.OrderLineService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/order-lines")
@RequiredArgsConstructor
@Tag(name = "OrderLine")
public class OrderLineController {

    private final OrderLineService service;

    @GetMapping
    public List<OrderLine> list() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public OrderLine get(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderLine create(@Valid @RequestBody OrderLine body) {
        return service.create(body);
    }

    @PutMapping("/{id}")
    public OrderLine update(@PathVariable Long id, @Valid @RequestBody OrderLine body) {
        return service.update(id, body);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
