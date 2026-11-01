package com.awd.produit.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.DefaultJackson2JavaTypeMapper;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Topologie côté CONSOMMATEUR (produit) : il déclare SA queue, sa DLQ et son binding.
 */
@Configuration
public class RabbitConfig {

    // Mêmes noms que dans commande
    public static final String EXCHANGE = "commande.events";
    public static final String ROUTING_KEY_LINE_CREATED = "orderline.created";

    // Queue propre à produit
    public static final String STOCK_QUEUE = "produit.stock.queue";

    // Dead letter : où vont les messages rejetés
    public static final String DEAD_LETTER_EXCHANGE = "commande.events.dlx";
    public static final String DEAD_LETTER_QUEUE = "produit.stock.queue.dlq";

    @Bean
    public TopicExchange commandeExchange() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    @Bean
    public DirectExchange deadLetterExchange() {
        return new DirectExchange(DEAD_LETTER_EXCHANGE, true, false);
    }

    @Bean
    public Queue deadLetterQueue() {
        return QueueBuilder.durable(DEAD_LETTER_QUEUE).build();
    }

    @Bean
    public Binding deadLetterBinding(Queue deadLetterQueue, DirectExchange deadLetterExchange) {
        return BindingBuilder.bind(deadLetterQueue).to(deadLetterExchange).with(STOCK_QUEUE);
    }

    @Bean
    public Queue stockQueue() {
        return QueueBuilder.durable(STOCK_QUEUE)
                .deadLetterExchange(DEAD_LETTER_EXCHANGE)
                .deadLetterRoutingKey(STOCK_QUEUE)
                .build();
    }

    @Bean
    public Binding stockBinding(Queue stockQueue, TopicExchange commandeExchange) {
        return BindingBuilder.bind(stockQueue).to(commandeExchange).with(ROUTING_KEY_LINE_CREATED);
    }

    // Le consommateur utilise le type du paramètre du listener, pas le nom de classe de commande
    @Bean
    public MessageConverter jsonMessageConverter(ObjectMapper objectMapper) {
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter(objectMapper);
        DefaultJackson2JavaTypeMapper typeMapper = new DefaultJackson2JavaTypeMapper();
        typeMapper.setTypePrecedence(DefaultJackson2JavaTypeMapper.TypePrecedence.INFERRED);
        converter.setJavaTypeMapper(typeMapper);
        return converter;
    }
}