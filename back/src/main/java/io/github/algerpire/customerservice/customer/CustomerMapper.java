package io.github.algerpire.customerservice.customer;

import org.springframework.stereotype.Component;

@Component
public class CustomerMapper {
    public CustomerResponse toResponse(Customer customer) {
        return new CustomerResponse(
                customer.getId(),
                customer.getName(),
                customer.getEmail(),
                customer.getPhotoUrl(),
                customer.getRole(),
                customer.isActive(),
                customer.isEmailVerified(),
                customer.getCreatedAt(),
                customer.getUpdatedAt()
        );
    }
}
