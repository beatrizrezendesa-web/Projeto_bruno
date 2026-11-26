package br.com.backend_jbmoda.repository;

import br.com.backend_jbmoda.model.entity.ItemVenda;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ItemVendaRepository extends JpaRepository<ItemVenda, Long> {

    List<ItemVenda> findByVendaId(Long id);
}