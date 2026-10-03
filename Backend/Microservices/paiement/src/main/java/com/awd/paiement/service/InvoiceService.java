package com.awd.paiement.service;

import com.awd.paiement.entity.Invoice;
import com.awd.paiement.repository.InvoiceRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository repository;

    public List<Invoice> findAll() {
        return repository.findAll();
    }

    public Invoice findById(Long id) {
        return repository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Invoice " + id + " not found"));
    }

    public Invoice create(Invoice e) {
        e.setId(null);
        return repository.save(e);
    }

    public Invoice update(Long id, Invoice e) {
        findById(id);
        e.setId(id);
        return repository.save(e);
    }

    public void delete(Long id) {
        findById(id);
        repository.deleteById(id);
    }
}
