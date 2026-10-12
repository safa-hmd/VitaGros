package com.awd.paiement.repository;

import com.awd.paiement.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByInvoiceOrderId(Long orderId);
    List<Payment> findByInvoiceUserId(Long userId);
}
