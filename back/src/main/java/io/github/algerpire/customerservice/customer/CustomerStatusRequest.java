package io.github.algerpire.customerservice.customer;

import jakarta.validation.constraints.NotNull;

public record CustomerStatusRequest(@NotNull Boolean active) {}
