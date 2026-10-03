package com.awd.livraison.service;

import com.awd.livraison.entity.Delivery;
import com.awd.livraison.repository.DeliveryRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class DeliveryService {

    private final DeliveryRepository repository;

    public List<Delivery> findAll() {
        return repository.findAll();
    }

    public Delivery findById(Long id) {
        return repository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery " + id + " not found"));
    }

    public Delivery create(Delivery e) {
        e.setId(null);
        return repository.save(e);
    }

    public Delivery update(Long id, Delivery e) {
        findById(id);
        e.setId(id);
        return repository.save(e);
    }

    public void delete(Long id) {
        findById(id);
        repository.deleteById(id);
    }
}
