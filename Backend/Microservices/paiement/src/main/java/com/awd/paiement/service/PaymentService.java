package com.awd.paiement.service;

import com.awd.paiement.client.OrderClient;
import com.awd.paiement.config.RabbitConfig;
import com.awd.paiement.dto.PayRequest;
import com.awd.paiement.entity.*;
import com.awd.paiement.event.PaymentCompleted;
import com.awd.paiement.repository.InvoiceRepository;
import com.awd.paiement.repository.PaymentRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
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
    private final RabbitTemplate rabbit;

    private final OrderClient orders;

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
        orders.get(r.orderId());

        if (!repository.findByInvoiceOrderId(r.orderId()).isEmpty())
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Order already has a payment");

        Invoice inv = new Invoice();
        inv.setOrderId(r.orderId());
        inv.setUserId(r.userId());
        inv.setAmount(r.amount());
        inv = invoiceRepository.save(inv);

        Payment p = new Payment();
        p.setMethod(r.method());
        p.setAmount(r.amount());
        p.setInvoice(inv);
        Payment saved = "CARD".equals(r.method()) ? create(p) : createPending(p);
        orders.markPaid(r.orderId());

        if (saved.getStatus() == PaymentStatus.PAID) publishCompleted(saved);
        return saved;
    }

    private Payment createPending(Payment e) {
        if (!METHODS.contains(e.getMethod()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "method must be one of " + METHODS);
        e.setStatus(PaymentStatus.PENDING);
        return repository.save(e);   // la facture reste UNPAID
    }
    private void publishCompleted(Payment p) {
        Invoice inv = p.getInvoice();
        String eventId = UUID.randomUUID().toString();
        rabbit.convertAndSend(RabbitConfig.EXCHANGE, RabbitConfig.PAYMENT_COMPLETED,
                new PaymentCompleted(eventId, p.getId(), inv.getOrderId(), inv.getUserId(),
                        p.getAmount(), p.getMethod(), p.getTransactionRef(), p.getPaidAt()),
                new CorrelationData(eventId));
    }
    @Transactional
    public Payment markAsPaid(Long id) {
        Payment p = findById(id);
        if (p.getStatus() != PaymentStatus.PENDING)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Payment is not pending");

        p.setStatus(PaymentStatus.PAID);
        p.setPaidAt(LocalDateTime.now());
        Invoice inv = p.getInvoice();
        inv.setStatus(InvoiceStatus.PAID);
        invoiceRepository.save(inv);

        Payment saved = repository.save(p);
        publishCompleted(saved);
        return saved;
    }

    public List<Payment> findByOrder(Long orderId) {
        return repository.findByInvoiceOrderId(orderId);
    }

    public List<Payment> findByUser(Long userId) {
        return repository.findByInvoiceUserId(userId);
    }
}