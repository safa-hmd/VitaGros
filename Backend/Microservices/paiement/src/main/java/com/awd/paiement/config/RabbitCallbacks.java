package com.awd.paiement.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class RabbitCallbacks {

    private final RabbitTemplate rabbit;

    @PostConstruct
    void init() {
        rabbit.setConfirmCallback((corr, ack, cause) -> {
            String id = corr != null ? corr.getId() : "?";
            if (ack) log.info("payment.completed confirmé par le broker, eventId={}", id);
            else log.error("payment.completed REFUSÉ par le broker, eventId={}, cause={}", id, cause);
        });
        rabbit.setReturnsCallback(r -> log.error(
                "payment.completed NON ROUTÉ (aucune queue liée) : key={}, code={}, texte={}",
                r.getRoutingKey(), r.getReplyCode(), r.getReplyText()));
    }
}