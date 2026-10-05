package io.github.algerpire.customerservice.customer;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CustomerRepository extends JpaRepository<Customer, UUID> {
    Optional<Customer> findByEmailIgnoreCase(String email);
    Page<Customer> findAllByOrderByCreatedAtDesc(Pageable pageable);
    boolean existsByEmailIgnoreCase(String email);
}
