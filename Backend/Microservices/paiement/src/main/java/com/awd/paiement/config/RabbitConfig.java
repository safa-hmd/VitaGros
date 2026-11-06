package com.awd.paiement.config;

import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.*;

@Configuration
public class RabbitConfig {

    public static final String EXCHANGE = "vitagros.events";
    public static final String PAYMENT_COMPLETED = "payment.completed";

    @Bean
    TopicExchange vitagrosEvents() {
        return new TopicExchange(EXCHANGE, true, false);   // topic, durable
    }

    @Bean
    MessageConverter jsonConverter() {
        return new Jackson2JsonMessageConverter();
    }
}