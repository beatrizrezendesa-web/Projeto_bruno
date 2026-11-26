package br.com.backend_jbmoda.service;

import br.com.backend_jbmoda.model.entity.*;
import br.com.backend_jbmoda.repository.PedidoRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PedidoService {

    private final PedidoRepository pedidoRepo;
    private final ClienteService clienteService;
    private final ItemPedidoService itemPedidoService;
    private final VendaService vendaService;

    public List<Pedido> listar() {
        return pedidoRepo.findAll();
    }

    public Pedido buscar(Long id) {
        return pedidoRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Pedido não encontrado"));
    }

    public Pedido cadastrar(Pedido dados) {

        validar(dados);

        Cliente cliente = clienteService.buscar(
                dados.getCliente().getId());

        List<ItemPedido> itens =
                itemPedidoService.prepararItens(dados.getItens());

        Pedido pedido = new Pedido();

        pedido.setCliente(cliente);
        pedido.setData(LocalDateTime.now());
        pedido.setStatus("ABERTO");
        pedido.setTipoEntrega(dados.getTipoEntrega());
        pedido.setEnderecoEntrega(dados.getEnderecoEntrega());
        pedido.setFrete(dados.getFrete());
        pedido.setObservacoes(dados.getObservacoes());

        pedido = pedidoRepo.save(pedido);

        pedido.setItens(
                itemPedidoService.cadastrarItens(pedido, itens));

        return pedido;
    }

    public Pedido atualizar(Long id, Pedido dados) {

        Pedido pedido = buscar(id);

        verificarStatus(pedido);
        validar(dados);

        Cliente cliente = clienteService.buscar(
                dados.getCliente().getId());

        List<ItemPedido> itens =
                itemPedidoService.prepararItens(dados.getItens());

        pedido.setCliente(cliente);
        pedido.setTipoEntrega(dados.getTipoEntrega());
        pedido.setEnderecoEntrega(dados.getEnderecoEntrega());
        pedido.setFrete(dados.getFrete());
        pedido.setObservacoes(dados.getObservacoes());

        itemPedidoService.excluirPorPedido(id);

        pedido.setItens(
                itemPedidoService.cadastrarItens(pedido, itens));

        return pedidoRepo.save(pedido);
    }

    public Pedido cancelar(Long id) {

        Pedido pedido = buscar(id);

        verificarStatus(pedido);

        pedido.setStatus("CANCELADO");

        return pedidoRepo.save(pedido);
    }

    public Venda confirmar(
            Long id,
            String formaPagamento,
            String canal,
            String statusPagamento,
            LocalDate dataVencimento) {

        Pedido pedido = buscar(id);

        verificarStatus(pedido);

        Venda venda = vendaService.cadastrarPorPedido(
                pedido,
                formaPagamento,
                canal,
                statusPagamento,
                dataVencimento);

        pedido.setStatus("CONCLUIDO");

        pedidoRepo.save(pedido);

        return venda;
    }

    public BigDecimal calcularTotal(Long id) {

        Pedido pedido = buscar(id);

        BigDecimal total = pedido.getFrete();

        for (ItemPedido item : pedido.getItens()) {

            BigDecimal subtotal = item.getPrecoUnitario()
                    .multiply(BigDecimal.valueOf(
                            item.getQuantidade()));

            total = total.add(subtotal);
        }

        return total;
    }

    private void verificarStatus(Pedido pedido) {

        if (!"ABERTO".equals(pedido.getStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Pedido não está aberto");
        }
    }

    private void validar(Pedido pedido) {

        if (pedido.getCliente() == null
                || pedido.getCliente().getId() == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe o cliente");
        }

        if (!"ENTREGA".equals(pedido.getTipoEntrega())
                && !"RETIRADA".equals(pedido.getTipoEntrega())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tipo de entrega inválido");
        }

        if ("ENTREGA".equals(pedido.getTipoEntrega())
                && (pedido.getEnderecoEntrega() == null
                || pedido.getEnderecoEntrega().isBlank())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe o endereço");
        }

        if (pedido.getFrete() == null
                || pedido.getFrete().signum() < 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Frete inválido");
        }

        if ("RETIRADA".equals(pedido.getTipoEntrega())
                && pedido.getFrete().signum() != 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Retirada não possui frete");
        }
    }
}