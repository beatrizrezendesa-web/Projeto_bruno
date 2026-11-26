package br.com.backend_jbmoda.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "financeiro")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Financeiro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_financeiro")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "venda_id")
    private Venda venda;

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @NotBlank
    private String descricao;

    @NotBlank
    private String categoria;

    @NotBlank
    private String tipo;

    @NotNull
    @DecimalMin("0.01")
    @Column(precision = 12, scale = 2)
    private BigDecimal valor;

    @Column(name = "data_vencimento")
    private LocalDate dataVencimento;

    @Column(name = "data_pagamento")
    private LocalDate dataPagamento;

    @NotBlank
    private String status = "PENDENTE";
}