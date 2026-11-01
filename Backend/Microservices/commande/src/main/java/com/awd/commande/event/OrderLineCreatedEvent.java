package com.awd.commande.event;

/**
 * Événement « une ligne de commande a été créée ».
 * eventId est unique : le consommateur s'en sert pour ignorer un doublon.
 */
public record OrderLineCreatedEvent(String eventId, Long orderLineId, Long productId, Integer quantity) {

}