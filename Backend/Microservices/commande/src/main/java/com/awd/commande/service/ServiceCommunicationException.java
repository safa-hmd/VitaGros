package com.awd.commande.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class ServiceCommunicationException extends ResponseStatusException {

    public ServiceCommunicationException(HttpStatus status, String reason) {
        super(status, reason);
    }
}
