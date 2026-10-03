package com.awd.commande.service;

import com.awd.commande.entity.CustomerOrder;
import com.awd.commande.repository.CustomerOrderRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class CustomerOrderService {

    private final CustomerOrderRepository repository;

    public List<CustomerOrder> findAll() {
        return repository.findAll();
    }

    public CustomerOrder findById(Long id) {
        return repository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "CustomerOrder " + id + " not found"));
    }

    public CustomerOrder create(CustomerOrder e) {
        e.setId(null);
        return repository.save(e);
    }

    public CustomerOrder update(Long id, CustomerOrder e) {
        findById(id);
        e.setId(id);
        return repository.save(e);
    }

    public void delete(Long id) {
        findById(id);
        repository.deleteById(id);
    }
}
