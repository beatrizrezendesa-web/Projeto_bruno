package br.com.backend_jbmoda.service;

import br.com.backend_jbmoda.model.entity.*;
import br.com.backend_jbmoda.repository.ItemVendaRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ItemVendaService {

    private final ItemVendaRepository itemVendaRepo;
    private final ProdutoService produtoService;

    public List<ItemVenda> listarPorVenda(Long vendaId) {
        return itemVendaRepo.findByVendaId(vendaId);
    }

    public ItemVenda buscar(Long id) {
        return itemVendaRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Item não encontrado"));
    }

    public List<ItemVenda> prepararItens(List<ItemVenda> itens) {

        if (itens == null || itens.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe os produtos da venda");
        }

        List<ItemVenda> lista = new ArrayList<>();

        for (ItemVenda item : itens) {

            validar(item);

            Produto produto = produtoService.buscar(
                    item.getProduto().getId());

            ItemVenda existente = null;

            for (ItemVenda i : lista) {

                if (i.getProduto().getId().equals(produto.getId())) {
                    existente = i;
                    break;
                }
            }

            if (existente != null) {

                existente.setQuantidade(Math.addExact(
                        existente.getQuantidade(),
                        item.getQuantidade()));

            } else {

                ItemVenda novo = new ItemVenda();

                novo.setProduto(produto);
                novo.setQuantidade(item.getQuantidade());
                novo.setPrecoUnitario(produto.getPreco());

                lista.add(novo);
            }
        }

        validarEstoque(lista);

        return lista;
    }

    public List<ItemVenda> prepararItensPedido(
            List<ItemPedido> itens) {

        if (itens == null || itens.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Pedido sem produtos");
        }

        List<ItemVenda> lista = new ArrayList<>();

        for (ItemPedido item : itens) {

            Produto produto = produtoService.buscar(
                    item.getProduto().getId());

            ItemVenda novo = new ItemVenda();

            novo.setProduto(produto);
            novo.setQuantidade(item.getQuantidade());
            novo.setPrecoUnitario(item.getPrecoUnitario());

            lista.add(novo);
        }

        validarEstoque(lista);

        return lista;
    }

    public List<ItemVenda> cadastrarItens(
            Venda venda, List<ItemVenda> itens) {

        for (ItemVenda item : itens) {

            item.setVenda(venda);

            produtoService.baixarEstoque(
                    item.getProduto().getId(),
                    item.getQuantidade());
        }

        return itemVendaRepo.saveAll(itens);
    }

    public BigDecimal calcularTotal(List<ItemVenda> itens) {

        BigDecimal total = BigDecimal.ZERO;

        for (ItemVenda item : itens) {

            BigDecimal subtotal = item.getPrecoUnitario()
                    .multiply(BigDecimal.valueOf(
                            item.getQuantidade()));

            total = total.add(subtotal);
        }

        return total;
    }

    public void devolverEstoque(Long vendaId) {

        for (ItemVenda item : listarPorVenda(vendaId)) {

            produtoService.devolverEstoque(
                    item.getProduto().getId(),
                    item.getQuantidade());
        }
    }

    private void validar(ItemVenda item) {

        if (item == null
                || item.getProduto() == null
                || item.getProduto().getId() == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe o produto");
        }

        if (item.getQuantidade() == null
                || item.getQuantidade() <= 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Quantidade inválida");
        }
    }

    private void validarEstoque(List<ItemVenda> itens) {

        for (ItemVenda item : itens) {

            Produto produto = item.getProduto();

            if (!Boolean.TRUE.equals(produto.getDisponivel())) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Produto indisponível: " + produto.getNome());
            }

            long quantidade = 0;

            for (ItemVenda i : itens) {

                if (i.getProduto().getId().equals(produto.getId())) {
                    quantidade += i.getQuantidade();
                }
            }

            if (produto.getQuantidadeEstoque() < quantidade) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Estoque insuficiente: " + produto.getNome());
            }
        }
    }
}