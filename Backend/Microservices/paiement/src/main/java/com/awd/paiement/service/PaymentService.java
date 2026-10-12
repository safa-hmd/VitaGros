package com.awd.paiement.service;

import com.awd.paiement.dto.PayRequest;
import com.awd.paiement.entity.*;
import com.awd.paiement.repository.InvoiceRepository;
import com.awd.paiement.repository.PaymentRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final List<String> METHODS = List.of("CARD", "CASH", "TRANSFER");

    private final PaymentRepository repository;
    private final InvoiceRepository invoiceRepository;

    public List<Payment> findAll() {
        return repository.findAll();
    }

    public Payment findById(Long id) {
        return repository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment " + id + " not found"));
    }

    @Transactional
    public Payment create(Payment e) {
        if (!METHODS.contains(e.getMethod()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "method must be one of " + METHODS);

        Invoice inv = invoiceRepository.findById(e.getInvoice().getId()).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Invoice not found"));

        if (inv.getStatus() == InvoiceStatus.PAID)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Invoice already paid");
        if (!inv.getAmount().equals(e.getAmount()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "amount must equal invoice amount");

        e.setId(null);
        e.setInvoice(inv);
        e.setStatus(PaymentStatus.PAID);
        inv.setStatus(InvoiceStatus.PAID);
        invoiceRepository.save(inv);
        return repository.save(e);
    }

    public Payment update(Long id, Payment e) {
        findById(id);
        e.setId(id);
        return repository.save(e);
    }

    public void delete(Long id) {
        findById(id);
        repository.deleteById(id);
    }

    @Transactional
    public Payment pay(PayRequest r) {
        if (invoiceRepository.existsByOrderIdAndStatus(r.orderId(), InvoiceStatus.PAID))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Order already paid");

        Invoice inv = new Invoice();
        inv.setOrderId(r.orderId());
        inv.setUserId(r.userId());
        inv.setAmount(r.amount());
        inv = invoiceRepository.save(inv);

        Payment p = new Payment();
        p.setMethod(r.method());
        p.setAmount(r.amount());
        p.setInvoice(inv);
        return create(p);
    }

    public List<Payment> findByOrder(Long orderId) {
        return repository.findByInvoiceOrderId(orderId);
    }

    public List<Payment> findByUser(Long userId) {
        return repository.findByInvoiceUserId(userId);
    }
}