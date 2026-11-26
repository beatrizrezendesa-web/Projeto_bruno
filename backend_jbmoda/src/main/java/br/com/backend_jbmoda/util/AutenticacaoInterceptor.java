package br.com.backend_jbmoda.util;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AutenticacaoInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) {

        if ("OPTIONS".equals(request.getMethod())) {
            return true;
        }

        HttpSession session = request.getSession(false);

        if (session == null ||
                session.getAttribute("usuarioId") == null) {

            response.setStatus(401);
            return false;
        }

        return true;
    }
}