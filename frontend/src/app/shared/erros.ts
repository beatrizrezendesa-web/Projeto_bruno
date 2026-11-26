import { HttpErrorResponse } from '@angular/common/http';

export function mensagemErro(erro: unknown, contexto = 'concluir a operação', conflito?: string): string {
  if (!(erro instanceof HttpErrorResponse)) return erro instanceof Error ? erro.message : `Não foi possível ${contexto}.`;
  const corpo = erro.error;
  const detalhe = [corpo?.detail, corpo?.message, corpo?.reason].find(v => typeof v === 'string' && v.trim() && !/Validation failed|Error count|Failed to convert|JSON parse|MethodArgumentNotValid/i.test(v) && !['Bad Request','Conflict','Unauthorized','Not Found','Internal Server Error','No message available'].includes(v));
  switch (erro.status) {
    case 0: return 'Não foi possível conectar ao servidor. Verifique se o backend está funcionando e tente novamente.';
    case 400: {
      const campos: Record<string,string> = {cliente:'Cliente',status:'Situação',tipoEntrega:'Tipo de entrega',frete:'Frete',dataVencimento:'Vencimento',dataPagamento:'Pagamento',itens:'Produtos',nome:'Nome',telefone:'Telefone',endereco:'Endereço',enderecoEntrega:'Endereço de entrega',categoria:'Categoria',tamanho:'Tamanho',cor:'Cor',preco:'Preço',quantidadeEstoque:'Quantidade em estoque',quantidade:'Quantidade',produto:'Produto',precoUnitario:'Preço unitário',formaPagamento:'Forma de pagamento',canal:'Canal de venda',valor:'Valor',descricao:'Descrição',tipo:'Tipo',email:'E-mail',senha:'Senha'};
      const erros = Array.isArray(corpo?.errors) ? corpo.errors.map((x: {field?:string})=>`${campos[(x.field??'').split('.').pop()??''] ?? 'Campo informado'}: valor inválido ou obrigatório.`).join(' ') : '';
      return erros || detalhe || 'Confira os campos obrigatórios e os valores informados. O servidor recusou o cadastro.';
    }
    case 401: return 'Sua sessão expirou. Entre novamente.';
    case 403: return 'Você não tem permissão para realizar esta operação.';
    case 404: return detalhe || 'O registro não foi encontrado. Atualize a página e tente novamente.';
    case 409: return (detalhe && !/^Cliente possui registros vinculados$/.test(detalhe) ? detalhe : undefined) || conflito || detalhe || 'A operação foi bloqueada por registros vinculados, estoque ou situação do registro. Atualize os dados e confira antes de tentar novamente.';
    default: return `Não foi possível ${contexto}. O servidor apresentou uma falha. Confira os dados antes de tentar novamente.`;
  }
}
