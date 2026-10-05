package io.github.algerpire.customerservice.customer;

import java.time.Instant;
import java.util.UUID;

public record CustomerResponse(
        UUID id,
        String name,
        String email,
        String photoUrl,
        Role role,
        boolean active,
        boolean emailVerified,
        Instant createdAt,
        Instant updatedAt
) {}
