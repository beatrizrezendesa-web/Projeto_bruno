package br.com.backend_jbmoda.controller;

import br.com.backend_jbmoda.model.entity.Usuario;
import br.com.backend_jbmoda.service.UsuarioService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    @PostMapping("/login")
    public Usuario login(
            @RequestBody Map<String, String> dados,
            HttpServletRequest request) {

        String email = dados.get("email");
        String senha = dados.get("senha");

        if (email == null || senha == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe o email e a senha");
        }

        Usuario usuario = usuarioService.login(email, senha);

        HttpSession session = request.getSession();

        request.changeSessionId();

        session.setAttribute("usuarioId", usuario.getId());

        return usuario;
    }

    @GetMapping("/sessao")
    public Usuario sessao(HttpServletRequest request) {

        HttpSession session = request.getSession(false);

        if (session == null
                || session.getAttribute("usuarioId") == null) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Sessão inválida");
        }

        return usuarioService.buscar(
                (Long) session.getAttribute("usuarioId"));
    }

    @PostMapping("/logout")
    public void logout(HttpServletRequest request) {

        HttpSession session = request.getSession(false);

        if (session != null) {

            session.invalidate();
        }
    }
}