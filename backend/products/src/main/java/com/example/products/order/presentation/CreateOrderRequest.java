package com.example.products.order.presentation;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateOrderRequest(
        @NotBlank @Size(max = 100) String customerName,
        @NotBlank @Email @Size(max = 254) String customerEmail,
        @NotEmpty List<@Valid OrderItemRequest> items
) {
}
