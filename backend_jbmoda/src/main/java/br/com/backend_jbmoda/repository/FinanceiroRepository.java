package br.com.backend_jbmoda.repository;

import br.com.backend_jbmoda.model.entity.Financeiro;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FinanceiroRepository extends JpaRepository<Financeiro, Long> {

    List<Financeiro> findByVendaId(Long vendaId);
}