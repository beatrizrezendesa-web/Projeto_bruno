package br.com.backend_jbmoda.service;

import br.com.backend_jbmoda.model.entity.*;
import br.com.backend_jbmoda.repository.FinanceiroRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FinanceiroService {

    private final FinanceiroRepository financeiroRepo;
    private final ClienteService clienteService;

    public List<Financeiro> listar() {
        return financeiroRepo.findAll();
    }

    public Financeiro buscar(Long id) {
        return financeiroRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Lançamento não encontrado"));
    }

    public Financeiro cadastrar(Financeiro financeiro) {

        validar(financeiro);

        financeiro.setId(null);
        financeiro.setVenda(null);

        if (financeiro.getCliente() != null) {

            financeiro.setCliente(clienteService.buscar(
                    financeiro.getCliente().getId()));
        }

        return financeiroRepo.save(financeiro);
    }

    public Financeiro atualizar(Long id, Financeiro dados) {

        Financeiro financeiro = buscar(id);

        verificarVenda(financeiro);
        validar(dados);

        if (dados.getCliente() != null) {

            financeiro.setCliente(clienteService.buscar(
                    dados.getCliente().getId()));

        } else {

            financeiro.setCliente(null);
        }

        financeiro.setDescricao(dados.getDescricao());
        financeiro.setCategoria(dados.getCategoria());
        financeiro.setTipo(dados.getTipo());
        financeiro.setValor(dados.getValor());
        financeiro.setDataVencimento(dados.getDataVencimento());
        financeiro.setDataPagamento(dados.getDataPagamento());
        financeiro.setStatus(dados.getStatus());

        return financeiroRepo.save(financeiro);
    }

    public void excluir(Long id) {

        Financeiro financeiro = buscar(id);

        verificarVenda(financeiro);

        financeiroRepo.delete(financeiro);
    }

    public Financeiro registrarVenda(
            Venda venda,
            String status,
            LocalDate dataVencimento) {

        if (!financeiroRepo.findByVendaId(venda.getId()).isEmpty()) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Venda já registrada no financeiro");
        }

        Financeiro financeiro = new Financeiro();

        financeiro.setVenda(venda);
        financeiro.setCliente(venda.getCliente());
        financeiro.setDescricao("Venda #" + venda.getId());
        financeiro.setCategoria("VENDAS");
        financeiro.setTipo("ENTRADA");
        financeiro.setValor(venda.getTotal());
        financeiro.setStatus(status);
        financeiro.setDataVencimento(dataVencimento);

        if ("PAGO".equals(status)) {
            financeiro.setDataPagamento(LocalDate.now());
        }

        validar(financeiro);

        return financeiroRepo.save(financeiro);
    }

    public Financeiro registrarPagamento(Long id) {

        Financeiro financeiro = buscar(id);

        if (!"PENDENTE".equals(financeiro.getStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Lançamento não está pendente");
        }

        financeiro.setStatus("PAGO");
        financeiro.setDataPagamento(LocalDate.now());

        return financeiroRepo.save(financeiro);
    }

    public void cancelarVenda(Long vendaId) {

        for (Financeiro financeiro :
                financeiroRepo.findByVendaId(vendaId)) {

            financeiro.setStatus("CANCELADO");
            financeiro.setDataPagamento(null);

            financeiroRepo.save(financeiro);
        }
    }

    private void verificarVenda(Financeiro financeiro) {

        if (financeiro.getVenda() != null) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Lançamento vinculado a uma venda");
        }
    }

    private void validar(Financeiro financeiro) {

        if (!"ENTRADA".equals(financeiro.getTipo())
                && !"SAIDA".equals(financeiro.getTipo())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tipo inválido");
        }

        if (!"PAGO".equals(financeiro.getStatus())
                && !"PENDENTE".equals(financeiro.getStatus())
                && !"CANCELADO".equals(financeiro.getStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Status inválido");
        }

        if (financeiro.getValor() == null
                || financeiro.getValor().signum() <= 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Valor inválido");
        }

        if (financeiro.getCliente() != null
                && financeiro.getCliente().getId() == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Cliente inválido");
        }

        if ("PENDENTE".equals(financeiro.getStatus())
                && financeiro.getDataVencimento() == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe a data de vencimento");
        }

        if ("PAGO".equals(financeiro.getStatus())
                && financeiro.getDataPagamento() == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe a data de pagamento");
        }

        if (!"PAGO".equals(financeiro.getStatus())
                && financeiro.getDataPagamento() != null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Lançamento não está pago");
        }
    }
}