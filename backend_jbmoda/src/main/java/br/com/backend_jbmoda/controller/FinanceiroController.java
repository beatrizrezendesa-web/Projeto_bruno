package br.com.backend_jbmoda.controller;

import br.com.backend_jbmoda.model.entity.Financeiro;
import br.com.backend_jbmoda.service.FinanceiroService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import java.util.List;

@RestController
@RequestMapping("/financeiro")
@RequiredArgsConstructor
public class FinanceiroController {

    private final FinanceiroService financeiroService;

    @GetMapping
    public List<Financeiro> listar() {
        return financeiroService.listar();
    }

    @GetMapping("/{id}")
    public Financeiro buscar(@PathVariable Long id) {
        return financeiroService.buscar(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Financeiro cadastrar(
            @Valid @RequestBody Financeiro financeiro) {

        return financeiroService.cadastrar(financeiro);
    }

    @PutMapping("/{id}")
    public Financeiro atualizar(
            @PathVariable Long id,
            @Valid @RequestBody Financeiro financeiro) {

        return financeiroService.atualizar(id, financeiro);
    }

    @PutMapping("/{id}/pagar")
    public Financeiro registrarPagamento(@PathVariable Long id) {
        return financeiroService.registrarPagamento(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        financeiroService.excluir(id);
    }
}