package com.awd.paiement.controller;

import com.awd.paiement.entity.Payment;
import com.awd.paiement.service.PaymentService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Payment")
public class PaymentController {

    private final PaymentService service;

    @GetMapping
    public List<Payment> list() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Payment get(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Payment create(@Valid @RequestBody Payment body) {
        return service.create(body);
    }

    @PutMapping("/{id}")
    public Payment update(@PathVariable Long id, @Valid @RequestBody Payment body) {
        return service.update(id, body);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
