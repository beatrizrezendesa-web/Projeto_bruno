package br.com.backend_jbmoda.service;

import br.com.backend_jbmoda.model.entity.*;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;

@Service
@RequiredArgsConstructor
public class RelatorioService {

    private final ClienteService clienteService;
    private final ProdutoService produtoService;
    private final PedidoService pedidoService;
    private final VendaService vendaService;
    private final FinanceiroService financeiroService;

    // RELATÓRIO DE VENDAS

    public Map<String, Object> vendas(
            LocalDate inicio, LocalDate fim) {

        validarDatas(inicio, fim);

        int quantidade = 0;
        BigDecimal total = BigDecimal.ZERO;

        for (Venda venda : vendaService.listar()) {

            LocalDate data = venda.getData().toLocalDate();

            if ("CONCLUIDA".equals(venda.getStatus())
                    && dentroPeriodo(data, inicio, fim)) {

                quantidade++;
                total = total.add(venda.getTotal());
            }
        }

        return Map.of(
                "inicio", inicio,
                "fim", fim,
                "quantidadeVendas", quantidade,
                "totalVendido", total
        );
    }

    // RELATÓRIO DE ESTOQUE

    public List<Produto> estoque(int limite) {

        if (limite < 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Limite inválido");
        }

        List<Produto> lista = new ArrayList<>();

        for (Produto produto : produtoService.listar()) {

            if (produto.getQuantidadeEstoque() <= limite) {
                lista.add(produto);
            }
        }

        return lista;
    }

    // RELATÓRIO FINANCEIRO

    public Map<String, Object> financeiro(
            LocalDate inicio, LocalDate fim) {

        validarDatas(inicio, fim);

        BigDecimal entradas = BigDecimal.ZERO;
        BigDecimal saidas = BigDecimal.ZERO;
        BigDecimal aReceber = BigDecimal.ZERO;
        BigDecimal aPagar = BigDecimal.ZERO;

        for (Financeiro f : financeiroService.listar()) {

            if ("PAGO".equals(f.getStatus())
                    && dentroPeriodo(
                    f.getDataPagamento(), inicio, fim)) {

                if ("ENTRADA".equals(f.getTipo())) {

                    entradas = entradas.add(f.getValor());

                } else if ("SAIDA".equals(f.getTipo())) {

                    saidas = saidas.add(f.getValor());
                }
            }

            if ("PENDENTE".equals(f.getStatus())
                    && dentroPeriodo(
                    f.getDataVencimento(), inicio, fim)) {

                if ("ENTRADA".equals(f.getTipo())) {

                    aReceber = aReceber.add(f.getValor());

                } else if ("SAIDA".equals(f.getTipo())) {

                    aPagar = aPagar.add(f.getValor());
                }
            }
        }

        return Map.of(
                "inicio", inicio,
                "fim", fim,
                "entradas", entradas,
                "saidas", saidas,
                "saldo", entradas.subtract(saidas),
                "aReceber", aReceber,
                "aPagar", aPagar
        );
    }

    // DASHBOARD

    public Map<String, Object> dashboard() {

        LocalDate hoje = LocalDate.now();
        LocalDate inicioMes = hoje.withDayOfMonth(1);
        LocalDate fimMes = hoje.withDayOfMonth(
                hoje.lengthOfMonth());

        List<Produto> produtos = produtoService.listar();
        List<Pedido> pedidos = pedidoService.listar();

        long totalPecas = 0;
        int pedidosAbertos = 0;

        BigDecimal totalAReceber = BigDecimal.ZERO;
        BigDecimal totalAPagar = BigDecimal.ZERO;

        for (Produto produto : produtos) {

            totalPecas += produto.getQuantidadeEstoque();
        }

        for (Pedido pedido : pedidos) {

            if ("ABERTO".equals(pedido.getStatus())) {
                pedidosAbertos++;
            }
        }

        for (Financeiro f : financeiroService.listar()) {

            if ("PENDENTE".equals(f.getStatus())) {

                if ("ENTRADA".equals(f.getTipo())) {

                    totalAReceber =
                            totalAReceber.add(f.getValor());

                } else if ("SAIDA".equals(f.getTipo())) {

                    totalAPagar =
                            totalAPagar.add(f.getValor());
                }
            }
        }

        pedidos.sort((p1, p2) ->
                p2.getData().compareTo(p1.getData()));

        List<Pedido> pedidosRecentes = new ArrayList<>();

        for (int i = 0; i < pedidos.size() && i < 5; i++) {

            pedidosRecentes.add(pedidos.get(i));
        }

        List<Produto> estoqueBaixo = estoque(5);

        Map<String, Object> resultado = new LinkedHashMap<>();

        resultado.put("clientes", clienteService.listar().size());
        resultado.put("produtos", produtos.size());
        resultado.put("totalPecas", totalPecas);
        resultado.put("pedidosAbertos", pedidosAbertos);
        resultado.put("vendasDoMes", vendas(inicioMes, hoje));
        resultado.put("financeiroDoMes",
                financeiro(inicioMes, fimMes));
        resultado.put("totalAReceber", totalAReceber);
        resultado.put("totalAPagar", totalAPagar);
        resultado.put("produtosComEstoqueBaixo", estoqueBaixo.size());
        resultado.put("listaEstoqueBaixo", estoqueBaixo);
        resultado.put("pedidosRecentes", pedidosRecentes);

        return resultado;
    }

    private boolean dentroPeriodo(
            LocalDate data, LocalDate inicio, LocalDate fim) {

        return data != null
                && !data.isBefore(inicio)
                && !data.isAfter(fim);
    }

    private void validarDatas(LocalDate inicio, LocalDate fim) {

        if (inicio == null
                || fim == null
                || inicio.isAfter(fim)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Período inválido");
        }
    }
}