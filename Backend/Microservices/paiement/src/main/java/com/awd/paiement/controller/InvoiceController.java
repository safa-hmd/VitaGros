package com.awd.paiement.controller;

import com.awd.paiement.entity.Invoice;
import com.awd.paiement.service.InvoiceService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
@Tag(name = "Invoice")
public class InvoiceController {

    private final InvoiceService service;

    @GetMapping
    public List<Invoice> list() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Invoice get(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Invoice create(@Valid @RequestBody Invoice body) {
        return service.create(body);
    }

    @PutMapping("/{id}")
    public Invoice update(@PathVariable Long id, @Valid @RequestBody Invoice body) {
        return service.update(id, body);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
