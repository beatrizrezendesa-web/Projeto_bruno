package br.com.backend_jbmoda.controller;

import br.com.backend_jbmoda.model.entity.Produto;
import br.com.backend_jbmoda.service.RelatorioService;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/relatorios")
@RequiredArgsConstructor
public class RelatorioController {

    private final RelatorioService relatorioService;

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        return relatorioService.dashboard();
    }

    @GetMapping("/vendas")
    public Map<String, Object> vendas(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate inicio,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fim) {

        return relatorioService.vendas(inicio, fim);
    }

    @GetMapping("/estoque")
    public List<Produto> estoque(
            @RequestParam(defaultValue = "5") int limite) {

        return relatorioService.estoque(limite);
    }

    @GetMapping("/financeiro")
    public Map<String, Object> financeiro(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate inicio,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fim) {

        return relatorioService.financeiro(inicio, fim);
    }
}