package com.awd.paiement.dto;

import jakarta.validation.constraints.*;

public record PayRequest(
        @NotNull Long orderId,
        Long userId,
        @NotNull @Positive Double amount,
        @NotBlank String method) {}