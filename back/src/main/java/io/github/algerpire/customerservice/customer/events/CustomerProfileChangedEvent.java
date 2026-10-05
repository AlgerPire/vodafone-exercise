package io.github.algerpire.customerservice.customer.events;

import java.util.UUID;

public record CustomerProfileChangedEvent(UUID customerId) {}
