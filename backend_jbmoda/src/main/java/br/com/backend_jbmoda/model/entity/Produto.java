package br.com.backend_jbmoda.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "produto")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Produto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_produto")
    private Long id;

    @NotBlank
    private String nome;

    @NotBlank
    private String categoria;

    @NotBlank
    private String tamanho;

    @NotBlank
    private String cor;

    @NotNull
    @DecimalMin("0.01")
    @Column(precision = 12, scale = 2)
    private BigDecimal preco;

    @NotNull
    @Min(0)
    @Column(name = "quantidade_estoque")
    private Integer quantidadeEstoque;

    @NotNull
    private Boolean disponivel = true;
}
