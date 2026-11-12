
package com.awd.livraison.service;

import com.awd.livraison.client.CommandeClient;
import com.awd.livraison.dto.OrderDTO;
import com.awd.livraison.entity.Delivery;
import com.awd.livraison.repository.DeliveryRepository;

import feign.FeignException;
import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class DeliveryService {

    private final DeliveryRepository repository;
    private final CommandeClient commandeClient;

    public List<Delivery> findAll() {
        return repository.findAll();
    }

    public Delivery findById(Long id) {
        return repository.findById(id).orElseThrow(() ->
                new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Delivery " + id + " not found"
                ));
    }

    public Delivery create(Delivery e) {

        OrderDTO order;

        // Communication synchrone avec le microservice Commande
        try {
            order = commandeClient.getOrderById(e.getOrderId());

        } catch (FeignException.NotFound ex) {

            // Commande inexistante
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Order " + e.getOrderId() + " not found"
            );

        } catch (FeignException ex) {

            // Erreur de communication avec Commande
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Unable to communicate with Commande service"
            );
        }

        // Vérification de la réponse
        if (order == null || order.id() == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Order not found"
            );
        }

        // Enregistrement de la livraison
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
