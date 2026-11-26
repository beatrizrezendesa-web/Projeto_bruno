package br.com.backend_jbmoda.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pedido")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pedido")
    private Long id;

    @NotNull
    @ManyToOne(optional = false)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    private LocalDateTime data = LocalDateTime.now();

    @NotBlank
    private String status = "ABERTO";

    @NotBlank
    @Column(name = "tipo_entrega")
    private String tipoEntrega;

    @Column(name = "endereco_entrega")
    private String enderecoEntrega;

    @NotNull
    @DecimalMin("0.00")
    @Column(precision = 12, scale = 2)
    private BigDecimal frete = BigDecimal.ZERO;

    private String observacoes;

    @OneToMany(mappedBy = "pedido")
    private List<ItemPedido> itens = new ArrayList<>();
}