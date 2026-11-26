package br.com.backend_jbmoda.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "item_pedido")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ItemPedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_item_pedido")
    private Long id;

    @JsonIgnore
    @NotNull
    @ManyToOne(optional = false)
    @JoinColumn(name = "pedido_id")
    private Pedido pedido;

    @NotNull
    @ManyToOne(optional = false)
    @JoinColumn(name = "produto_id")
    private Produto produto;

    @NotNull
    @Min(1)
    private Integer quantidade;

    @NotNull
    @DecimalMin("0.01")
    @Column(name = "preco_unitario", precision = 12, scale = 2)
    private BigDecimal precoUnitario;
}