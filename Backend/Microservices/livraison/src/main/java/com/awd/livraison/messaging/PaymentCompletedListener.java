package com.awd.livraison.messaging;

import com.awd.livraison.config.RabbitConfig;
import com.awd.livraison.event.PaymentCompleted;
import com.rabbitmq.client.Channel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@Slf4j
public class PaymentCompletedListener {

    @RabbitListener(queues = RabbitConfig.QUEUE)
    public void onPaymentCompleted(PaymentCompleted e, Channel ch,
                                   @Header(AmqpHeaders.DELIVERY_TAG) long tag) throws IOException {
        try {
            log.info("payment.completed reçu : {}", e);
            ch.basicAck(tag, false);
        } catch (Exception ex) {
            log.error("échec traitement {}", e.eventId(), ex);
            ch.basicNack(tag, false, false);   // requeue=false -> DLQ
        }
    }
}
