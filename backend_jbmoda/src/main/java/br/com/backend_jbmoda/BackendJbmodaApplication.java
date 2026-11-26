package br.com.backend_jbmoda;

import br.com.backend_jbmoda.service.UsuarioService;
import br.com.backend_jbmoda.repository.UsuarioRepository;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class BackendJbmodaApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendJbmodaApplication.class, args);
	}

	@Bean
	public CommandLineRunner iniciarUsuarios(
			UsuarioRepository usuarioRepo,
			UsuarioService usuarioService) {

		return args -> {

			// Administrador
			if (usuarioRepo.findByEmail("admin@jbmoda.com").isEmpty()) {

				usuarioService.criarUsuarioInicial(
						"Administrador",
						"admin@jbmoda.com",
						"Admin@123"
				);
			}

			// Proprietária
			if (usuarioRepo.findByEmail("dona@jbmoda.com").isEmpty()) {

				usuarioService.criarUsuarioInicial(
						"Proprietária",
						"dona@jbmoda.com",
						"Dona@123"
				);
			}
		};
	}
}