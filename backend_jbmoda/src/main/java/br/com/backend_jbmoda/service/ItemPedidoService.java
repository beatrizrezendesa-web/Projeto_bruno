package br.com.backend_jbmoda.service;

import br.com.backend_jbmoda.model.entity.*;
import br.com.backend_jbmoda.repository.ItemPedidoRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ItemPedidoService {

    private final ItemPedidoRepository itemPedidoRepo;
    private final ProdutoService produtoService;

    public List<ItemPedido> listarPorPedido(Long pedidoId) {
        return itemPedidoRepo.findByPedidoId(pedidoId);
    }

    public ItemPedido buscar(Long id) {
        return itemPedidoRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Item não encontrado"));
    }

    public List<ItemPedido> prepararItens(List<ItemPedido> itens) {

        if (itens == null || itens.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe os produtos do pedido");
        }

        List<ItemPedido> lista = new ArrayList<>();

        for (ItemPedido item : itens) {

            validar(item);

            Produto produto = produtoService.buscar(
                    item.getProduto().getId());

            if (!Boolean.TRUE.equals(produto.getDisponivel())) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Produto indisponível");
            }

            ItemPedido existente = null;

            for (ItemPedido i : lista) {

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

                ItemPedido novo = new ItemPedido();

                novo.setProduto(produto);
                novo.setQuantidade(item.getQuantidade());
                novo.setPrecoUnitario(produto.getPreco());

                lista.add(novo);
            }
        }

        return lista;
    }

    public List<ItemPedido> cadastrarItens(
            Pedido pedido, List<ItemPedido> itens) {

        for (ItemPedido item : itens) {
            item.setPedido(pedido);
        }

        return itemPedidoRepo.saveAll(itens);
    }

    public void excluirPorPedido(Long pedidoId) {

        itemPedidoRepo.deleteAll(
                itemPedidoRepo.findByPedidoId(pedidoId));
    }

    private void validar(ItemPedido item) {

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
}