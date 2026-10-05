package io.github.algerpire.customerservice.auth;

import io.github.algerpire.customerservice.common.error.ApiException;
import io.github.algerpire.customerservice.customer.Customer;
import io.github.algerpire.customerservice.mail.VerificationMailer;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

@Service
public class EmailVerificationService {
    private static final Duration TOKEN_TTL = Duration.ofHours(24);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final EmailVerificationTokenRepository tokenRepository;
    private final VerificationMailer verificationMailer;

    public EmailVerificationService(EmailVerificationTokenRepository tokenRepository, VerificationMailer verificationMailer) {
        this.tokenRepository = tokenRepository;
        this.verificationMailer = verificationMailer;
    }

    @Transactional
    public String issueToken(Customer customer) {
        tokenRepository.deleteAllByCustomer(customer);
        String rawToken = generateRawToken();
        tokenRepository.save(new EmailVerificationToken(customer, sha256(rawToken), Instant.now().plus(TOKEN_TTL)));
        return verificationMailer.sendVerificationEmail(customer.getName(), customer.getEmail(), rawToken);
    }

    @Transactional
    public void verify(String rawToken) {
        EmailVerificationToken token = tokenRepository.findByTokenHash(sha256(rawToken))
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "INVALID_VERIFICATION_TOKEN", "The verification link is invalid."));

        if (token.isUsed() || token.isExpired()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_VERIFICATION_TOKEN", "The verification link is invalid or expired.");
        }

        token.getCustomer().setEmailVerified(true);
        token.markUsed();
        tokenRepository.save(token);
    }

    private static String generateRawToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return Base64.getUrlEncoder().withoutPadding().encodeToString(
                    digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is unavailable", ex);
        }
    }
}
