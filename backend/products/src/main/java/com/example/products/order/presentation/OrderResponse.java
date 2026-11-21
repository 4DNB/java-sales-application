package com.example.products.order.presentation;

import com.example.products.order.persistence.OrderEntity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        Long id,
        String customerName,
        String customerEmail,
        BigDecimal total,
        LocalDateTime createdAt,
        List<OrderItemResponse> items
) {
    public static OrderResponse from(OrderEntity order) {
        return new OrderResponse(
                order.getId(),
                order.getCustomerName(),
                order.getCustomerEmail(),
                order.getTotal(),
                order.getCreatedAt(),
                order.getItems().stream().map(OrderItemResponse::from).toList()
        );
    }
}
