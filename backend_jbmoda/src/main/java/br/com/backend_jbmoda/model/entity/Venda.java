package br.com.backend_jbmoda.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "venda")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Venda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_venda")
    private Long id;

    @NotNull
    @ManyToOne(optional = false)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    private LocalDateTime data = LocalDateTime.now();

    @NotBlank
    private String status = "CONCLUIDA";

    @DecimalMin("0.00")
    @Column(precision = 12, scale = 2)
    private BigDecimal total = BigDecimal.ZERO;

    @NotBlank
    @Column(name = "forma_pagamento")
    private String formaPagamento;

    @OneToOne
    @JoinColumn(name = "pedido_id", unique = true)
    private Pedido pedido;

    @NotBlank
    private String canal;

    @OneToMany(mappedBy = "venda")
    private List<ItemVenda> itens = new ArrayList<>();
}