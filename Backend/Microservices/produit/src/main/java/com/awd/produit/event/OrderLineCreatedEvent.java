package com.awd.produit.event;

// Même structure que dans commande (les noms des champs doivent être identiques)
public record OrderLineCreatedEvent(String eventId, Long orderLineId, Long productId, Integer quantity) {

}