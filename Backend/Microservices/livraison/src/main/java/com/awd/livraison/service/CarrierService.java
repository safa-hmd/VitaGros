package com.awd.livraison.service;

import com.awd.livraison.entity.Carrier;
import com.awd.livraison.repository.CarrierRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class CarrierService {

    private final CarrierRepository repository;

    public List<Carrier> findAll() {
        return repository.findAll();
    }

    public Carrier findById(Long id) {
        return repository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Carrier " + id + " not found"));
    }

    public Carrier create(Carrier e) {
        e.setId(null);
        return repository.save(e);
    }

    public Carrier update(Long id, Carrier e) {
        findById(id);
        e.setId(id);
        return repository.save(e);
    }

    public void delete(Long id) {
        findById(id);
        repository.deleteById(id);
    }
}
