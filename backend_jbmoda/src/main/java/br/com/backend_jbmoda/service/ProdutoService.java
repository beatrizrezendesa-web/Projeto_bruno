package br.com.backend_jbmoda.service;

import br.com.backend_jbmoda.model.entity.Produto;
import br.com.backend_jbmoda.repository.ProdutoRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProdutoService {

    private final ProdutoRepository produtoRepo;

    public List<Produto> listar() {
        return produtoRepo.findAll();
    }

    public Produto buscar(Long id) {
        return produtoRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Produto não encontrado"));
    }

    public Produto cadastrar(Produto produto) {

        produto.setId(null);

        return produtoRepo.save(produto);
    }

    public Produto atualizar(Long id, Produto dados) {

        Produto produto = buscar(id);

        produto.setNome(dados.getNome());
        produto.setCategoria(dados.getCategoria());
        produto.setTamanho(dados.getTamanho());
        produto.setCor(dados.getCor());
        produto.setPreco(dados.getPreco());
        produto.setQuantidadeEstoque(
                dados.getQuantidadeEstoque());
        produto.setDisponivel(dados.getDisponivel());

        return produtoRepo.save(produto);
    }

    public void excluir(Long id) {

        Produto produto = buscar(id);

        try {
            produtoRepo.delete(produto);

        } catch (DataIntegrityViolationException e) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Produto possui registros vinculados");
        }
    }

    public void baixarEstoque(Long id, Integer quantidade) {

        validarQuantidade(quantidade);

        Produto produto = buscar(id);

        if (!Boolean.TRUE.equals(produto.getDisponivel())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Produto indisponível");
        }

        if (produto.getQuantidadeEstoque() < quantidade) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Estoque insuficiente");
        }

        produto.setQuantidadeEstoque(
                produto.getQuantidadeEstoque() - quantidade);

        produtoRepo.save(produto);
    }

    public void devolverEstoque(Long id, Integer quantidade) {

        validarQuantidade(quantidade);

        Produto produto = buscar(id);

        produto.setQuantidadeEstoque(Math.addExact(
                produto.getQuantidadeEstoque(), quantidade));

        produtoRepo.save(produto);
    }

    private void validarQuantidade(Integer quantidade) {

        if (quantidade == null || quantidade <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Quantidade inválida");
        }
    }
}