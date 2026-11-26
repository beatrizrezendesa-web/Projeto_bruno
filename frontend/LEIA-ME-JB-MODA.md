# JB MODA — frontend revisado

Esta versão parte do ZIP JBModa_frontend_corrigido.zip (a interface com modais que estava sendo testada nos prints). O frontend(1).zip reenviado contém a versão anterior, com dados demonstrativos e sem os modais. As páginas, CSS, imagens, Services e identidade visual existentes foram preservados; não foram instaladas bibliotecas novas nem feitas alterações no Figma.

## Executar

1. Faça backup do projeto e do banco MySQL.
2. Aplique as correções Java do ZIP separado JBModa_backend_correcoes.zip ao backend existente. Veja o LEIA-ME desse ZIP. Não substitua o banco ou o application.properties inteiro.
3. Confira antes de reiniciar o Java: `spring.jpa.hibernate.ddl-auto=update`. O valor `create` apaga os dados ao reiniciar.
4. Inicie MySQL e Spring Boot (porta 8080). Preserve as credenciais existentes.
5. Extraia este ZIP em uma pasta nova. Dentro da pasta frontend, onde está package.json, execute `npm ci` e depois `npm start -- --open` (ou `ng serve -o`).
6. Acesse `http://localhost:4200` e entre com as credenciais cadastradas no backend. O endereço da API continua `http://localhost:8080` e o CORS deve aceitar localhost:4200.

## Correções e regras

- Novo pedido: envia explicitamente status ABERTO e os atributos da entidade, verifica cliente, entrega, itens e estoque disponível. O ID vem do Java/banco; o aviso exibe esse número se retornado. Pedido aberto não reserva nem baixa estoque; o servidor revalida estoque na confirmação. A verificação na tela impede enviar quantidade maior que o estoque atual.
- Confirmação do pedido: mantém a regra Java que converte pedido em venda (status interno CONCLUIDO); a interface chama isso de Convertido em venda, não de pagamento concluído. O pagamento pode continuar pendente. Vencimento é obrigatório quando pendente e deve ser hoje ou posterior, sem preenchimento automático.
- Vendas: situação financeira obtida de /financeiro, com filtro de recebidas e a receber. Vendas diretas não têm pedido associado e são identificadas como Venda direta. Uma venda originada de pedido usa o ID real do pedido.
- Financeiro: datas de pagamento não podem ser posteriores a hoje. Novas datas de vencimento de pendências não podem ser anteriores a hoje. Pendências antigas podem continuar vencidas e ser pagas normalmente; a edição permite manter o vencimento anterior sem retroagir para outra data. Registros pagos já gravados com data futura são sinalizados e não entram no total de pagamentos efetivos; não são modificados automaticamente.
- Entradas/saídas são pagamentos efetivos no mês; A receber e A pagar incluem todas as pendências. Depois de receber/pagar, a tabela e os valores são recarregados do servidor.
- Relatórios: período inicial padrão é o mês completo, incluindo vencimentos futuros dentro dele. Exibe e exporta separadamente pendências do período e totais de todas as pendências. O CSV existente continua disponível para Excel.
- Clientes: nome precisa conter letras; telefone com DDD de 10 ou 11 dígitos (ou +55 com 12/13 dígitos). Não são alterados registros antigos automaticamente. Exclusão vinculada continua bloqueada pelo Java e a mensagem informa o nome do cliente.
- Modal único reutilizado com cabeçalho e ações visíveis, campos roláveis quando necessário; espaçamento comum de botões e colunas em tabelas administrativas.
- Erros 400/409/401/404/500 e conexão continuam tratados. Com a classe TratamentoErros do ZIP Java, o campo rejeitado na validação do pedido passa a aparecer no formulário em português. O erro original dos prints não identifica qual campo foi recusado; não foi possível reproduzir a validação no Java real.

## Verificação realizada

- TypeScript da aplicação: passou.
- Compilador Angular (templates e componentes): passou.
- TypeScript dos testes: passou.
- Testes de lógica com respostas simuladas: passaram para pedido acima do estoque, cadastro válido com status ABERTO e ID retornado, erro 400 com campo identificado, vencimento passado, recebimento/pagamento e atualização de totais, pagamento futuro, situação financeira de venda e filtro, relatório de pendências totais vs período, confirmação de pedido pendente com data inválida/válida.
- O navegador local bloqueou a abertura da página de teste (ERR_BLOCKED_BY_ADMINISTRATOR). O Angular CLI disponível exige Node mais novo do que 22.16.0 neste ambiente. Não foi realizado build completo nem teste com o MySQL real. O backend Java separado foi revisado no código, mas não compilado aqui por indisponibilidade de Maven/dependências Spring. A versão local do backend pode ter diferenças em relação ao último ZIP Java fornecido.

## Teste real recomendado

Crie um cliente válido e um produto com estoque 5. Abra um pedido para 1 unidade: deve retornar número e aparecer como Aberto. Tente 6 unidades: deve aparecer estoque insuficiente, sem salvar. Confirme o pedido como Pendente e com vencimento futuro: o pedido fica Convertido em venda, a venda vinculada aparece como A receber e o Financeiro gera a pendência. Receba o pagamento: o total a receber deve diminuir e a venda passa a Recebida ao retornar à tela Vendas. Teste também um lançamento de despesa e seu pagamento. Uma venda direta não tem ID de pedido. Se o POST /pedidos ainda retornar 400, abra F12 > Network > pedidos > Response e veja qual campo foi recusado; a resposta do tratamento Java deve identificá-lo. Não envie senhas ou cookies.
