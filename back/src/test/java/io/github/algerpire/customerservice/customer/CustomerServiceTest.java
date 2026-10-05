package io.github.algerpire.customerservice.customer;

import io.github.algerpire.customerservice.customer.events.CustomerProfileChangedEvent;
import io.github.algerpire.customerservice.auth.EmailVerificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class CustomerServiceTest {
    private CustomerRepository repository;
    private CustomerMapper mapper;
    private ApplicationEventPublisher publisher;
    private EmailVerificationService verificationService;
    private CustomerService service;

    @BeforeEach
    void setUp() {
        repository = mock(CustomerRepository.class);
        mapper = new CustomerMapper();
        publisher = mock(ApplicationEventPublisher.class);
        verificationService = mock(EmailVerificationService.class);
        service = new CustomerService(repository, mapper, publisher, verificationService,
                PasswordEncoderFactories.createDelegatingPasswordEncoder());
    }

    @Test
    void updateEmailRequiresReverificationAndPublishesCacheEvent() {
        UUID id = UUID.randomUUID();
        Customer customer = customer(id);
        when(repository.findById(id)).thenReturn(Optional.of(customer));
        when(repository.existsByEmailIgnoreCase("new@example.com")).thenReturn(false);
        when(repository.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CustomerResponse response = service.updateOwnProfile(id,
                new UpdateCustomerRequest("Jane Updated", "new@example.com", "https://example.com/new.jpg"));

        assertThat(response.email()).isEqualTo("new@example.com");
        assertThat(customer.isEmailVerified()).isFalse();
        verify(verificationService).issueToken(customer);
        ArgumentCaptor<CustomerProfileChangedEvent> eventCaptor = ArgumentCaptor.forClass(CustomerProfileChangedEvent.class);
        verify(publisher).publishEvent(eventCaptor.capture());
        assertThat(eventCaptor.getValue().customerId()).isEqualTo(id);
    }

    @Test
    void closeAccountDeactivatesCustomer() {
        UUID id = UUID.randomUUID();
        Customer customer = customer(id);
        when(repository.findById(id)).thenReturn(Optional.of(customer));
        when(repository.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CustomerResponse response = service.closeOwnAccount(id);

        assertThat(response.active()).isFalse();
        verify(repository).save(eq(customer));
    }

    private Customer customer(UUID id) {
        Customer customer = new Customer();
        customer.setName("Jane");
        customer.setEmail("jane@example.com");
        customer.setPhotoUrl("https://example.com/jane.jpg");
        customer.setPasswordHash("hash");
        customer.setRole(Role.CUSTOMER);
        customer.setActive(true);
        customer.setEmailVerified(true);
        try {
            var field = Customer.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(customer, id);
        } catch (ReflectiveOperationException ex) {
            throw new AssertionError(ex);
        }
        return customer;
    }
}
