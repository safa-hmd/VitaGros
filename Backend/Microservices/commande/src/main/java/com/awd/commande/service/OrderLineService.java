package com.awd.commande.service;

import com.awd.commande.client.ProductClient;
import com.awd.commande.client.ProductResponse;
import com.awd.commande.entity.OrderLine;
import com.awd.commande.repository.OrderLineRepository;
import feign.FeignException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class OrderLineService {

    private final OrderLineRepository repository;
    private final ProductClient productClient;

    public List<OrderLine> findAll() {
        return repository.findAll();
    }

    public OrderLine findById(Long id) {
        return repository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "OrderLine " + id + " not found"));
    }

    public OrderLine create(OrderLine e) {
        validateQuantity(e.getQuantity());
        ProductResponse product = getProduct(e.getProductId());
        updateStock(product, -e.getQuantity());
        e.setUnitPrice(product.price());
        e.setId(null);
        try {
            return repository.save(e);
        } catch (RuntimeException ex) {
            updateStock(getProduct(product.id()), e.getQuantity());
            throw ex;
        }
    }

    public OrderLine update(Long id, OrderLine e) {
        validateQuantity(e.getQuantity());
        OrderLine existing = findById(id);
        if (existing.getProductId().equals(e.getProductId())) {
            ProductResponse product = getProduct(existing.getProductId());
            int stockDelta = existing.getQuantity() - e.getQuantity();
            updateStock(product, stockDelta);
            e.setUnitPrice(existing.getUnitPrice());
            e.setId(id);
            try {
                return repository.save(e);
            } catch (RuntimeException ex) {
                updateStock(getProduct(product.id()), -stockDelta);
                throw ex;
            }
        }

        ProductResponse oldProduct = getProduct(existing.getProductId());
        ProductResponse newProduct = getProduct(e.getProductId());
        updateStock(oldProduct, existing.getQuantity());
        try {
            updateStock(newProduct, -e.getQuantity());
        } catch (RuntimeException ex) {
            updateStock(getProduct(oldProduct.id()), -existing.getQuantity());
            throw ex;
        }
        e.setUnitPrice(newProduct.price());
        e.setId(id);
        try {
            return repository.save(e);
        } catch (RuntimeException ex) {
            updateStock(getProduct(newProduct.id()), e.getQuantity());
            updateStock(getProduct(oldProduct.id()), -existing.getQuantity());
            throw ex;
        }
    }

    public void delete(Long id) {
        OrderLine existing = findById(id);
        ProductResponse product = getProduct(existing.getProductId());
        updateStock(product, existing.getQuantity());
        try {
            repository.deleteById(id);
        } catch (RuntimeException ex) {
            updateStock(getProduct(product.id()), -existing.getQuantity());
            throw ex;
        }
    }

    private ProductResponse getProduct(Long productId) {
        if (productId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "productId is required");
        }
        try {
            return productClient.findById(productId);
        } catch (FeignException.NotFound ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product " + productId + " not found");
        } catch (FeignException ex) {
            throw new ServiceCommunicationException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Product service is unavailable");
        }
    }

    private void updateStock(ProductResponse product, int delta) {
        int currentStock = product.stock() == null ? 0 : product.stock();
        int newStock = currentStock + delta;
        if (newStock < 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Insufficient stock for product " + product.id());
        }
        try {
            productClient.update(product.id(), new ProductResponse(
                    product.id(), product.name(), product.price(), newStock, product.category()));
        } catch (FeignException ex) {
            throw new ServiceCommunicationException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Product service is unavailable");
        }
    }

    private void validateQuantity(Integer quantity) {
        if (quantity == null || quantity <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "quantity must be greater than zero");
        }
    }
}
