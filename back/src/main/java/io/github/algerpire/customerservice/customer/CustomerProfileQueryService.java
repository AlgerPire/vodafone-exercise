package io.github.algerpire.customerservice.customer;

import io.github.algerpire.customerservice.common.error.ApiException;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class CustomerProfileQueryService {
    private final CustomerRepository repository;
    private final CustomerMapper mapper;

    public CustomerProfileQueryService(CustomerRepository repository, CustomerMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Cacheable(cacheNames = "customerProfiles", key = "#id")
    @Transactional(readOnly = true)
    public CustomerResponse getProfile(UUID id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CUSTOMER_NOT_FOUND", "Customer was not found."));
    }
}
