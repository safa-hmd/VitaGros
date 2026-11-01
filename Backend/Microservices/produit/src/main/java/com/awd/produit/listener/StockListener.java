package com.awd.produit.listener;

import com.awd.produit.config.RabbitConfig;
import com.awd.produit.event.OrderLineCreatedEvent;
import com.awd.produit.service.ProductService;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class StockListener {

    private final ProductService productService;

    // eventId déjà traités (idempotence). En mémoire : perdu au redémarrage.
    private final Set<String> processedEventIds = ConcurrentHashMap.newKeySet();

    @RabbitListener(queues = RabbitConfig.STOCK_QUEUE)
    public void onOrderLineCreated(OrderLineCreatedEvent event) {
        log.info("Événement reçu : ligne {} produit {} quantité {} (eventId={})",
                event.orderLineId(), event.productId(), event.quantity(), event.eventId());

        if (processedEventIds.contains(event.eventId())) {
            log.info("Événement {} déjà traité : ignoré (consommateur idempotent)", event.eventId());
            return;
        }

        try {
            productService.decreaseStock(event.productId(), event.quantity());
            processedEventIds.add(event.eventId());
            log.info("Stock mis à jour pour le produit {}", event.productId());
        } catch (Exception e) {
            log.error("Échec de la mise à jour du stock (eventId={}) : {}", event.eventId(), e.getMessage());
            // Rejet sans remise en file : le message part dans la DLQ
            throw new AmqpRejectAndDontRequeueException("Stock non mis à jour", e);
        }
    }
}