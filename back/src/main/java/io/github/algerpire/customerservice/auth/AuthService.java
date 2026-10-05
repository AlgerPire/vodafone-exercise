package io.github.algerpire.customerservice.auth;

import io.github.algerpire.customerservice.common.error.ApiException;
import io.github.algerpire.customerservice.customer.MessageResponse;
import io.github.algerpire.customerservice.customer.Customer;
import io.github.algerpire.customerservice.customer.CustomerRepository;
import io.github.algerpire.customerservice.customer.Role;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationService verificationService;

    public AuthService(CustomerRepository customerRepository,
                       PasswordEncoder passwordEncoder,
                       EmailVerificationService verificationService) {
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
        this.verificationService = verificationService;
    }

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (customerRepository.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_ALREADY_REGISTERED", "An account with this email already exists.");
        }

        Customer customer = new Customer();
        customer.setName(request.name().trim());
        customer.setEmail(email);
        customer.setPhotoUrl(request.photoUrl().trim());
        customer.setPasswordHash(passwordEncoder.encode(request.password()));
        customer.setRole(Role.CUSTOMER);
        customer.setActive(true);
        customer.setEmailVerified(false);
        customer = customerRepository.save(customer);

        String verificationUrl = verificationService.issueToken(customer);
        return new RegisterResponse(
                "Account created. Open the confirmation link, then sign in.",
                verificationUrl);
    }

    @Transactional
    public MessageResponse verifyEmail(String rawToken) {
        verificationService.verify(rawToken);
        return new MessageResponse("Email verified successfully. You can now sign in.");
    }

    public static String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}
