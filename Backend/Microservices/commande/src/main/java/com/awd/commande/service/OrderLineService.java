package com.awd.commande.service;

import com.awd.commande.config.RabbitConfig;
import com.awd.commande.entity.OrderLine;
import com.awd.commande.event.OrderLineCreatedEvent;
import com.awd.commande.repository.OrderLineRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderLineService {

    private final OrderLineRepository repository;
    private final RabbitTemplate rabbitTemplate; // PRODUCTEUR

    public List<OrderLine> findAll() {
        return repository.findAll();
    }

    public OrderLine findById(Long id) {
        return repository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "OrderLine " + id + " not found"));
    }

    public OrderLine create(OrderLine e) {
        e.setId(null);
        OrderLine saved = repository.save(e);

        // Publier APRÈS la sauvegarde : on n'annonce jamais un fait qui n'a pas eu lieu
        publishOrderLineCreated(saved);
        return saved;
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

    private void publishOrderLineCreated(OrderLine saved) {
        String eventId = UUID.randomUUID().toString();
        OrderLineCreatedEvent event = new OrderLineCreatedEvent(
                eventId, saved.getId(), saved.getProductId(), saved.getQuantity());

        try {
            rabbitTemplate.convertAndSend(
                    RabbitConfig.EXCHANGE,
                    RabbitConfig.ROUTING_KEY_LINE_CREATED,
                    event,
                    message -> {
                        message.getMessageProperties().setMessageId(eventId);
                        message.getMessageProperties().setType("OrderLineCreated");
                        return message;
                    },
                    new CorrelationData(eventId));

            log.info("Événement OrderLineCreated publié : ligne {} (eventId={})", saved.getId(), eventId);
        } catch (AmqpException ex) {
            // RabbitMQ indisponible : la ligne est enregistrée mais l'événement est perdu
            log.error("Échec de publication pour la ligne {} : {}", saved.getId(), ex.getMessage());
        }
    }
}