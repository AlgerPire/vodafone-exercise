package io.github.algerpire.customerservice.customer;

import jakarta.validation.constraints.NotNull;

public record CustomerRoleRequest(@NotNull Role role) {}
