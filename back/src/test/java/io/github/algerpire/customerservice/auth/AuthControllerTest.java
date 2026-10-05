package io.github.algerpire.customerservice.auth;

import io.github.algerpire.customerservice.common.error.GlobalExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

class AuthControllerTest {
    @Test
    void registerReturnsCreated() throws Exception {
        AuthService authService = mock(AuthService.class);
        when(authService.register(any(RegisterRequest.class))).thenReturn(new RegisterResponse("ok", null));
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new AuthController(authService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Jane Doe\",\"email\":\"jane@example.com\",\"password\":\"StrongPassword123!\",\"photoUrl\":\"https://example.com/jane.jpg\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("ok"));
    }
}
