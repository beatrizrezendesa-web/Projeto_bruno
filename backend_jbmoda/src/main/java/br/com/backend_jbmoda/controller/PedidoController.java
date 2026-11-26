package br.com.backend_jbmoda.controller;

import br.com.backend_jbmoda.model.entity.*;
import br.com.backend_jbmoda.service.PedidoService;
import br.com.backend_jbmoda.service.ItemPedidoService;

import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;

@RestController
@RequestMapping("/pedidos")
@RequiredArgsConstructor
public class PedidoController {

    private final PedidoService pedidoService;
    private final ItemPedidoService itemPedidoService;

    @GetMapping
    public List<Pedido> listar() {
        return pedidoService.listar();
    }

    @GetMapping("/{id}")
    public Pedido buscar(@PathVariable Long id) {
        return pedidoService.buscar(id);
    }

    @GetMapping("/{id}/itens")
    public List<ItemPedido> listarItens(@PathVariable Long id) {

        pedidoService.buscar(id);

        return itemPedidoService.listarPorPedido(id);
    }

    @GetMapping("/{id}/total")
    public BigDecimal calcularTotal(@PathVariable Long id) {
        return pedidoService.calcularTotal(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Pedido cadastrar(@Valid @RequestBody Pedido pedido) {

        return pedidoService.cadastrar(pedido);
    }

    @PutMapping("/{id}")
    public Pedido atualizar(
            @PathVariable Long id,
            @Valid @RequestBody Pedido pedido) {

        return pedidoService.atualizar(id, pedido);
    }

    @PutMapping("/{id}/cancelar")
    public Pedido cancelar(@PathVariable Long id) {

        return pedidoService.cancelar(id);
    }

    @PutMapping("/{id}/confirmar")
    public Venda confirmar(
            @PathVariable Long id,
            @RequestBody Map<String, String> dados) {

        LocalDate dataVencimento = null;

        try {

            if (dados.get("dataVencimento") != null) {

                dataVencimento = LocalDate.parse(
                        dados.get("dataVencimento"));
            }

        } catch (DateTimeParseException e) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Data de vencimento inválida");
        }

        return pedidoService.confirmar(
                id,
                dados.get("formaPagamento"),
                dados.get("canal"),
                dados.get("statusPagamento"),
                dataVencimento);
    }
}