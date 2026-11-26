package br.com.backend_jbmoda.service;

import br.com.backend_jbmoda.model.entity.Usuario;
import br.com.backend_jbmoda.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepo;

    private final BCryptPasswordEncoder encoder =
            new BCryptPasswordEncoder();

    public Usuario buscar(Long id) {
        return usuarioRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Usuário não encontrado"));
    }

    public Usuario login(String email, String senha) {

        Usuario usuario = usuarioRepo.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Email ou senha inválidos"));

        if (!encoder.matches(senha, usuario.getSenha())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Email ou senha inválidos");
        }

        return usuario;
    }

    public void criarUsuarioInicial(String nome, String email,
                                    String senha) {

        if (usuarioRepo.findByEmail(email).isEmpty()) {

            Usuario usuario = new Usuario();

            usuario.setNome(nome);
            usuario.setEmail(email);
            usuario.setSenha(encoder.encode(senha));

            usuarioRepo.save(usuario);
        }
    }
}
