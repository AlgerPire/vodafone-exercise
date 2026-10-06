package io.github.algerpire.customerservice.mail;

import io.github.algerpire.customerservice.config.Properties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService implements VerificationMailer {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final Properties.MailProperties properties;

    public EmailService(JavaMailSender mailSender, Properties.MailProperties properties) {
        this.mailSender = mailSender;
        this.properties = properties;
    }

    @Override
    public String sendVerificationEmail(String recipientName, String recipientEmail, String rawToken) {
        String verificationUrl = properties.verificationBaseUrl() + "?token=" + rawToken;

        if (!properties.enabled()) {
            log.info("DEV EMAIL | customer={} | verificationUrl={}", recipientEmail, verificationUrl);
            return verificationUrl;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(properties.from());
        message.setTo(recipientEmail);
        message.setSubject("Confirm your Customer Service account");
        message.setText("Hello " + recipientName + ",\n\nConfirm your email address using this link:\n"
                + verificationUrl + "\n\nThe link expires in 24 hours.");
        try {
            mailSender.send(message);
        } catch (MailException ex) {
            log.warn("Verification email failed for {} | verificationUrl={}", recipientEmail, verificationUrl, ex);
            return verificationUrl;
        }
        return null;
    }
}
