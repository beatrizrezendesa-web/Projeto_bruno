package br.com.backend_jbmoda.repository;

import br.com.backend_jbmoda.model.entity.Venda;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VendaRepository extends JpaRepository<Venda, Long> {

}