package com.awd.livraison.event;

import java.time.LocalDateTime;

public record PaymentCompleted(
        String eventId, Long paymentId, Long orderId, Long userId,
        Double amount, String method, String transactionRef, LocalDateTime paidAt) {}
