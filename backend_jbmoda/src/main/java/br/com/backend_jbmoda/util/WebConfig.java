package br.com.backend_jbmoda.util;

import lombok.RequiredArgsConstructor;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final AutenticacaoInterceptor autenticacaoInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {

        registry.addInterceptor(autenticacaoInterceptor)
                .addPathPatterns("/**")
                .excludePathPatterns(
                        "/usuarios/login",
                        "/error"
                );
    }
}