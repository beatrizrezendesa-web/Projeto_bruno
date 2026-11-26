package br.com.backend_jbmoda.service;

import br.com.backend_jbmoda.model.entity.Cliente;
import br.com.backend_jbmoda.repository.ClienteRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final ClienteRepository clienteRepo;

    public List<Cliente> listar() {
        return clienteRepo.findAll();
    }

    public Cliente buscar(Long id) {
        return clienteRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Cliente não encontrado"));
    }

    public Cliente cadastrar(Cliente cliente) {

        cliente.setId(null);

        return clienteRepo.save(cliente);
    }

    public Cliente atualizar(Long id, Cliente dados) {

        Cliente cliente = buscar(id);

        cliente.setNome(dados.getNome());
        cliente.setTelefone(dados.getTelefone());
        cliente.setEndereco(dados.getEndereco());

        return clienteRepo.save(cliente);
    }

    public void excluir(Long id) {

        Cliente cliente = buscar(id);

        try {
            clienteRepo.delete(cliente);

        } catch (DataIntegrityViolationException e) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cliente possui registros vinculados");
        }
    }
}