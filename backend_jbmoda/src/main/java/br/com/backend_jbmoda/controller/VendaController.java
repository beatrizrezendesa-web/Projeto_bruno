package br.com.backend_jbmoda.controller;

import br.com.backend_jbmoda.model.entity.Venda;
import br.com.backend_jbmoda.model.entity.ItemVenda;
import br.com.backend_jbmoda.model.entity.Financeiro;

import br.com.backend_jbmoda.service.VendaService;
import br.com.backend_jbmoda.service.ItemVendaService;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/vendas")
@RequiredArgsConstructor
public class VendaController {

    private final VendaService vendaService;
    private final ItemVendaService itemVendaService;

    @GetMapping
    public List<Venda> listar() {
        return vendaService.listar();
    }

    @GetMapping("/{id}")
    public Venda buscar(@PathVariable Long id) {
        return vendaService.buscar(id);
    }

    @GetMapping("/{id}/itens")
    public List<ItemVenda> listarItens(@PathVariable Long id) {

        vendaService.buscar(id);

        return itemVendaService.listarPorVenda(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Venda cadastrar(@RequestBody Financeiro financeiro) {

        if (financeiro.getVenda() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe os dados da venda");
        }

        return vendaService.cadastrar(
                financeiro.getVenda(),
                financeiro.getStatus(),
                financeiro.getDataVencimento());
    }

    @PutMapping("/{id}/cancelar")
    public Venda cancelar(@PathVariable Long id) {
        return vendaService.cancelar(id);
    }
}