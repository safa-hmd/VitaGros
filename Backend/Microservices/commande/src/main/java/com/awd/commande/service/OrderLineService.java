package com.awd.commande.service;

import com.awd.commande.entity.OrderLine;
import com.awd.commande.repository.OrderLineRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class OrderLineService {

    private final OrderLineRepository repository;

    public List<OrderLine> findAll() {
        return repository.findAll();
    }

    public OrderLine findById(Long id) {
        return repository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "OrderLine " + id + " not found"));
    }

    public OrderLine create(OrderLine e) {
        e.setId(null);
        return repository.save(e);
    }

    public OrderLine update(Long id, OrderLine e) {
        findById(id);
        e.setId(id);
        return repository.save(e);
    }

    public void delete(Long id) {
        findById(id);
        repository.deleteById(id);
    }
}
