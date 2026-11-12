package com.awd.commande.service;

import com.awd.commande.client.UserClient;
import com.awd.commande.entity.CustomerOrder;
import com.awd.commande.repository.CustomerOrderRepository;
import feign.FeignException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class CustomerOrderService {

    private final CustomerOrderRepository repository;
    private final UserClient userClient;

    public List<CustomerOrder> findAll() {
        return repository.findAll();
    }

    public CustomerOrder findById(Long id) {
        return repository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "CustomerOrder " + id + " not found"));
    }

    public CustomerOrder create(CustomerOrder e) {
        validateUser(e.getUserId());
        e.setId(null);
        return repository.save(e);
    }

    public CustomerOrder update(Long id, CustomerOrder e) {
        findById(id);
        validateUser(e.getUserId());
        e.setId(id);
        return repository.save(e);
    }

    public void delete(Long id) {
        findById(id);
        repository.deleteById(id);
    }

    private void validateUser(Long userId) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId is required");
        }
        try {
            userClient.findById(userId);
        } catch (FeignException.NotFound ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User " + userId + " not found");
        } catch (FeignException ex) {
            throw new ServiceCommunicationException(HttpStatus.SERVICE_UNAVAILABLE,
                    "User service is unavailable");
        }
    }
}
