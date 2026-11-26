package br.com.backend_jbmoda.repository;

import br.com.backend_jbmoda.model.entity.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

}