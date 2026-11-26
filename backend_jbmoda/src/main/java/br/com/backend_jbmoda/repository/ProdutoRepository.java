package br.com.backend_jbmoda.repository;

import br.com.backend_jbmoda.model.entity.Produto;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProdutoRepository extends JpaRepository<Produto, Long> {

}
