package br.com.backend_jbmoda.repository;

import br.com.backend_jbmoda.model.entity.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

}