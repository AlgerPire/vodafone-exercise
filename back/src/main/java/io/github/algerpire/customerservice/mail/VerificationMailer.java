package io.github.algerpire.customerservice.mail;

/**
 * Sends an email-verification link. Returns the URL when outbound mail is disabled
 * so local development can show it; returns null after a real send.
 */
public interface VerificationMailer {
    String sendVerificationEmail(String recipientName, String recipientEmail, String rawToken);
}
