package com.awd.livraison.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
@Configuration
public class RabbitConfig {
    public static final String EXCHANGE = "vitagros.events";
    public static final String QUEUE = "livraison.payment.completed";
    public static final String DLX = "vitagros.events.dlx";
    public static final String DLQ = "livraison.payment.completed.dlq";

    @Bean
    TopicExchange events() { return new TopicExchange(EXCHANGE, true, false); } // identique à paiement
    @Bean
    DirectExchange dlx() { return new DirectExchange(DLX, true, false); }

    @Bean
    Queue paymentQueue() {
        return QueueBuilder.durable(QUEUE).deadLetterExchange(DLX).deadLetterRoutingKey(DLQ).build();
    }
    @Bean Queue paymentDlq() { return QueueBuilder.durable(DLQ).build(); }

    @Bean
    Binding paymentBinding() {
        return BindingBuilder.bind(paymentQueue()).to(events()).with("payment.completed");
    }
    @Bean Binding dlqBinding() {
        return BindingBuilder.bind(paymentDlq()).to(dlx()).with(DLQ);
    }

    @Bean
    MessageConverter jsonConverter() { return new Jackson2JsonMessageConverter(); }
}
