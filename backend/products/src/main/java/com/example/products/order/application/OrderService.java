package com.example.products.order.application;

import com.example.products.order.persistence.OrderEntity;
import com.example.products.order.persistence.OrderItemSnapshot;
import com.example.products.order.persistence.OrderRepository;
import com.example.products.order.presentation.CreateOrderRequest;
import com.example.products.order.presentation.OrderItemRequest;
import com.example.products.product.persistence.ProductEntity;
import com.example.products.product.persistence.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class OrderService {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    public OrderService(ProductRepository productRepository, OrderRepository orderRepository) {
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
    }

    @Transactional
    public OrderEntity create(CreateOrderRequest request) {
        Set<Long> productIds = new HashSet<>();
        List<OrderItemSnapshot> items = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        List<OrderItemRequest> requestedItems = request.items().stream()
                .sorted(Comparator.comparing(OrderItemRequest::productId))
                .toList();
        for (var requestedItem : requestedItems) {
            if (!productIds.add(requestedItem.productId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El producto está repetido en el pedido");
            }

            ProductEntity product = productRepository.findByIdForUpdate(requestedItem.productId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado"));
            if (product.getStock() < requestedItem.quantity()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "No hay suficiente inventario para " + product.getName());
            }

            product.setStock(product.getStock() - requestedItem.quantity());
            items.add(new OrderItemSnapshot(
                    product.getId(), product.getName(), requestedItem.quantity(), product.getPrice()
            ));
            total = total.add(product.getPrice().multiply(BigDecimal.valueOf(requestedItem.quantity())));
        }

        return orderRepository.save(new OrderEntity(
                request.customerName(), request.customerEmail(), total, items
        ));
    }
}
