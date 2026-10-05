package io.github.algerpire.customerservice.auth;

import io.github.algerpire.customerservice.customer.Customer;
import io.github.algerpire.customerservice.customer.CustomerRepository;
import io.github.algerpire.customerservice.customer.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AuthServiceTest {
    private CustomerRepository customerRepository;
    private EmailVerificationService verificationService;
    private AuthService authService;
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        customerRepository = mock(CustomerRepository.class);
        verificationService = mock(EmailVerificationService.class);
        passwordEncoder = PasswordEncoderFactories.createDelegatingPasswordEncoder();
        authService = new AuthService(customerRepository, passwordEncoder, verificationService);
    }

    @Test
    void registerCreatesCustomerAndVerificationToken() {
        RegisterRequest request = new RegisterRequest("Jane Doe", "Jane@example.com", "StrongPassword123!", "https://example.com/jane.jpg");
        when(customerRepository.existsByEmailIgnoreCase("jane@example.com")).thenReturn(false);
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> {
            Customer customer = invocation.getArgument(0);
            return customer;
        });

        RegisterResponse response = authService.register(request);

        assertThat(response.message()).contains("Account created");
        ArgumentCaptor<Customer> customerCaptor = ArgumentCaptor.forClass(Customer.class);
        verify(customerRepository).save(customerCaptor.capture());
        Customer saved = customerCaptor.getValue();
        assertThat(saved.getEmail()).isEqualTo("jane@example.com");
        assertThat(saved.getRole()).isEqualTo(Role.CUSTOMER);
        assertThat(saved.isEmailVerified()).isFalse();
        assertThat(saved.getPasswordHash()).isNotEqualTo(request.password());
        verify(verificationService).issueToken(saved);
    }
}
