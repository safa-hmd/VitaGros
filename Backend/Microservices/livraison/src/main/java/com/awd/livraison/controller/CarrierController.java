package com.awd.livraison.controller;

import com.awd.livraison.entity.Carrier;
import com.awd.livraison.service.CarrierService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/carriers")
@RequiredArgsConstructor
@Tag(name = "Carrier")
public class CarrierController {

    private final CarrierService service;

    @GetMapping
    public List<Carrier> list() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Carrier get(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Carrier create(@Valid @RequestBody Carrier body) {
        return service.create(body);
    }

    @PutMapping("/{id}")
    public Carrier update(@PathVariable Long id, @Valid @RequestBody Carrier body) {
        return service.update(id, body);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
