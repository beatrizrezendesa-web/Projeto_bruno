package br.com.backend_jbmoda.service;

import br.com.backend_jbmoda.model.entity.*;
import br.com.backend_jbmoda.repository.VendaRepository;
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
public class VendaService {

    private final VendaRepository vendaRepo;
    private final PedidoRepository pedidoRepo;
    private final ClienteService clienteService;
    private final ItemVendaService itemVendaService;
    private final FinanceiroService financeiroService;

    public List<Venda> listar() {
        return vendaRepo.findAll();
    }

    public Venda buscar(Long id) {
        return vendaRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Venda não encontrada"));
    }

    // VENDA DIRETA

    public Venda cadastrar(Venda dados,
                           String statusPagamento,
                           LocalDate dataVencimento) {

        validar(dados);
        validarPagamento(statusPagamento, dataVencimento);

        Cliente cliente = clienteService.buscar(
                dados.getCliente().getId());

        List<ItemVenda> itens =
                itemVendaService.prepararItens(dados.getItens());

        Venda venda = new Venda();

        venda.setCliente(cliente);
        venda.setData(LocalDateTime.now());
        venda.setStatus("CONCLUIDA");
        venda.setFormaPagamento(dados.getFormaPagamento());
        venda.setCanal(dados.getCanal());

        venda.setTotal(itemVendaService.calcularTotal(itens));

        return salvarVenda(
                venda, itens, statusPagamento, dataVencimento);
    }

    // VENDA POR PEDIDO

    public Venda cadastrarPorPedido(
            Pedido pedido,
            String formaPagamento,
            String canal,
            String statusPagamento,
            LocalDate dataVencimento) {

        if (!"ABERTO".equals(pedido.getStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Pedido não está aberto");
        }

        Venda venda = new Venda();

        venda.setCliente(pedido.getCliente());
        venda.setPedido(pedido);
        venda.setData(LocalDateTime.now());
        venda.setStatus("CONCLUIDA");
        venda.setFormaPagamento(formaPagamento);
        venda.setCanal(canal);

        validar(venda);
        validarPagamento(statusPagamento, dataVencimento);

        List<ItemVenda> itens =
                itemVendaService.prepararItensPedido(
                        pedido.getItens());

        BigDecimal total =
                itemVendaService.calcularTotal(itens);

        venda.setTotal(total.add(pedido.getFrete()));

        return salvarVenda(
                venda, itens, statusPagamento, dataVencimento);
    }

    private Venda salvarVenda(
            Venda venda,
            List<ItemVenda> itens,
            String statusPagamento,
            LocalDate dataVencimento) {

        if (venda.getTotal().signum() <= 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Total da venda inválido");
        }

        venda = vendaRepo.save(venda);

        venda.setItens(
                itemVendaService.cadastrarItens(venda, itens));

        financeiroService.registrarVenda(
                venda, statusPagamento, dataVencimento);

        return venda;
    }

    // CANCELAMENTO

    public Venda cancelar(Long id) {

        Venda venda = buscar(id);

        if (!"CONCLUIDA".equals(venda.getStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Venda não pode ser cancelada");
        }

        itemVendaService.devolverEstoque(id);

        financeiroService.cancelarVenda(id);

        venda.setStatus("CANCELADA");

        if (venda.getPedido() != null) {

            Pedido pedido = venda.getPedido();

            pedido.setStatus("CANCELADO");

            pedidoRepo.save(pedido);
        }

        return vendaRepo.save(venda);
    }

    // VALIDAÇÕES

    private void validar(Venda venda) {

        if (venda.getCliente() == null
                || venda.getCliente().getId() == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe o cliente");
        }

        if (!"PIX".equals(venda.getFormaPagamento())
                && !"DEBITO".equals(venda.getFormaPagamento())
                && !"CREDITO".equals(venda.getFormaPagamento())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Forma de pagamento inválida");
        }

        if (!"LOJA".equals(venda.getCanal())
                && !"WHATSAPP".equals(venda.getCanal())
                && !"INSTAGRAM".equals(venda.getCanal())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Canal inválido");
        }
    }

    private void validarPagamento(
            String status, LocalDate dataVencimento) {

        if (!"PAGO".equals(status)
                && !"PENDENTE".equals(status)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Status de pagamento inválido");
        }

        if ("PENDENTE".equals(status)
                && dataVencimento == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe a data de vencimento");
        }
    }
}