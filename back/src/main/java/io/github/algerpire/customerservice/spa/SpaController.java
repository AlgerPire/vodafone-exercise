package io.github.algerpire.customerservice.spa;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {
    @GetMapping({
            "/",
            "/login",
            "/register",
            "/verify-email",
            "/callback",
            "/signed-out",
            "/account",
            "/admin",
            "/admin/{*path}"
    })
    String index() {
        return "forward:/index.html";
    }
}
