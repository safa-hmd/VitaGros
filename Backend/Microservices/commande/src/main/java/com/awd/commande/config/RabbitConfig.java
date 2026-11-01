package com.awd.commande.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.MessageConverter;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.boot.autoconfigure.amqp.RabbitTemplateCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Topologie côté PRODUCTEUR (commande).
 * Règle : le producteur possède l'exchange, chaque consommateur possède SA queue.
 */
@Slf4j
@Configuration
public class RabbitConfig {

    // Mêmes noms dans commande et produit
    public static final String EXCHANGE = "commande.events";
    public static final String ROUTING_KEY_LINE_CREATED = "orderline.created";

    @Bean
    public TopicExchange commandeExchange() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    // Messages en JSON (lisibles par n'importe quel consommateur)
    @Bean
    public MessageConverter jsonMessageConverter(ObjectMapper objectMapper) {
        return new Jackson2JsonMessageConverter(objectMapper);
    }

    // Branche les callbacks de confirmation et de retour sur le RabbitTemplate auto-configuré
    @Bean
    public RabbitTemplateCustomizer rabbitTemplateCustomizer() {
        return template -> {
            template.setConfirmCallback((correlation, ack, cause) -> {
                String id = correlation != null ? correlation.getId() : "?";
                if (ack) {
                    log.debug("RabbitMQ a confirmé l'événement {}", id);
                } else {
                    log.error("RabbitMQ n'a PAS confirmé l'événement {} : {}", id, cause);
                }
            });
            template.setReturnsCallback(returned ->
                    log.warn("Événement non routable (aucune queue liée à '{}') : {}",
                            returned.getRoutingKey(), returned.getReplyText()));
        };
    }
}