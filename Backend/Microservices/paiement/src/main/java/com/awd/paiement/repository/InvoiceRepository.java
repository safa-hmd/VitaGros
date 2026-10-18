package com.awd.paiement.repository;

import com.awd.paiement.entity.Invoice;
import com.awd.paiement.entity.InvoiceStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByOrderId(Long orderId);
    List<Invoice> findByUserId(Long userId);
    boolean existsByOrderIdAndStatus(Long orderId, InvoiceStatus status);
}
