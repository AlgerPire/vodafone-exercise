package io.github.algerpire.customerservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableCaching
@EnableScheduling
public class CustomerServiceApplication {

    public static void main(String[] args) {
        // Gmail SMTP publishes IPv6 addresses. Railway containers often have no IPv6 route,
        // so the connection hangs until the timeout instead of using IPv4.
        System.setProperty("java.net.preferIPv4Stack", "true");
        SpringApplication.run(CustomerServiceApplication.class, args);
    }
}
