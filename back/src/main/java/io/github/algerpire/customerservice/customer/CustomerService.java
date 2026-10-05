package io.github.algerpire.customerservice.customer;

import io.github.algerpire.customerservice.auth.EmailVerificationService;
import io.github.algerpire.customerservice.common.error.ApiException;
import io.github.algerpire.customerservice.customer.events.CustomerProfileChangedEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class CustomerService {
    private final CustomerRepository repository;
    private final CustomerMapper mapper;
    private final ApplicationEventPublisher eventPublisher;
    private final EmailVerificationService verificationService;
    private final PasswordEncoder passwordEncoder;

    public CustomerService(CustomerRepository repository,
                           CustomerMapper mapper,
                           ApplicationEventPublisher eventPublisher,
                           EmailVerificationService verificationService,
                           PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.mapper = mapper;
        this.eventPublisher = eventPublisher;
        this.verificationService = verificationService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public CustomerResponse getById(UUID id) {
        return mapper.toResponse(findCustomer(id));
    }

    @Transactional(readOnly = true)
    public CustomerResponse getOwnProfile(UUID id) {
        return mapper.toResponse(findCustomer(id));
    }

    @Transactional
    public CustomerResponse updateOwnProfile(UUID id, UpdateCustomerRequest request) {
        Customer customer = findCustomer(id);
        String normalizedEmail = request.email().trim().toLowerCase();
        if (!normalizedEmail.equals(customer.getEmail()) && repository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_ALREADY_REGISTERED", "Another account already uses this email.");
        }

        boolean emailChanged = !normalizedEmail.equals(customer.getEmail());
        customer.setName(request.name().trim());
        customer.setEmail(normalizedEmail);
        customer.setPhotoUrl(request.photoUrl().trim());
        if (emailChanged) {
            customer.setEmailVerified(false);
        }

        Customer saved = repository.save(customer);
        if (emailChanged) {
            verificationService.issueToken(saved);
        }
        eventPublisher.publishEvent(new CustomerProfileChangedEvent(saved.getId()));
        return mapper.toResponse(saved);
    }

    @Transactional
    public void changePassword(UUID id, ChangePasswordRequest request) {
        Customer customer = findCustomer(id);
        if (!passwordEncoder.matches(request.currentPassword(), customer.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PASSWORD", "The current password is incorrect.");
        }
        customer.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        repository.save(customer);
    }

    @Transactional
    public CustomerResponse closeOwnAccount(UUID id) {
        Customer customer = findCustomer(id);
        if (!customer.isActive()) {
            return mapper.toResponse(customer);
        }
        customer.setActive(false);
        Customer saved = repository.save(customer);
        eventPublisher.publishEvent(new CustomerProfileChangedEvent(saved.getId()));
        return mapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<CustomerResponse> list(Pageable pageable) {
        return repository.findAllByOrderByCreatedAtDesc(pageable).map(mapper::toResponse);
    }

    @Transactional
    public CustomerResponse updateStatus(UUID id, CustomerStatusRequest request) {
        Customer customer = findCustomer(id);
        customer.setActive(request.active());
        Customer saved = repository.save(customer);
        eventPublisher.publishEvent(new CustomerProfileChangedEvent(saved.getId()));
        return mapper.toResponse(saved);
    }

    @Transactional
    public CustomerResponse updateRole(UUID id, CustomerRoleRequest request) {
        Customer customer = findCustomer(id);
        customer.setRole(request.role());
        Customer saved = repository.save(customer);
        eventPublisher.publishEvent(new CustomerProfileChangedEvent(saved.getId()));
        return mapper.toResponse(saved);
    }

    private Customer findCustomer(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CUSTOMER_NOT_FOUND", "Customer was not found."));
    }
}
