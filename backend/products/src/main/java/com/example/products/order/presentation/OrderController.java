package com.example.products.order.presentation;

import com.example.products.order.application.OrderService;
import com.example.products.order.persistence.OrderEntity;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@RestController
@RequestMapping("/api/v1/orders")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class OrderController {

    private final OrderService service;

    public OrderController(OrderService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<OrderResponse> create(@Valid @RequestBody CreateOrderRequest request) {
        OrderEntity order = service.create(request);
        OrderResponse response = OrderResponse.from(order);
        return ResponseEntity.created(URI.create("/api/v1/orders/" + response.id())).body(response);
    }
}
