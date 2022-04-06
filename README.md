# Desko Bifrost + IdSecure / ControlId

🚧  🚀 Em construção :: Prova de Conceito ...  🚧

## Descrição do Projeto

Bifrost é um micro-serviço com a capacidade se ser a ponte que estabelece a ligação entre o Desko e Outros Sistemas.

Esta versão é compatível com IdSecure da ControlId: https://www.controlid.com.br/docs/idsecure-pt/

### Pré-requisitos

Para ambiente Dev, você vai precisar ter instalado em sua máquina as seguintes ferramentas:
- [Git](https://git-scm.com),
- [Node.js](https://nodejs.org/en/). 
- [VSCode](https://code.visualstudio.com/)

### 🎲 Rodando Serviço

Este Gateway deverá ser instalado na mesma máquina na qual o IdSecure foi instalado:

1. Conecte no Banco de Dados MySql  do Id Secure e crie uma database
```
CREATE DATABASE desko_controlid
```

2. Faça checkout do Projeto e instale as dependencias

```bash
$ git clone <https://github.com/deskbee/bifrost-controlid>
$ cd bifrost-controlid/build
$ npm ci --production
```

3. Configurar .env
```
$ cp .env-example .env
```

4. Configure os parametros de autenticação

```
- Acesse o Painel Desko https://painel.desko.com.br
- No painel desko acesse Crie um Aplicativo Client conforme documentação, https://developers.desko.com.br/referencia-api/autenticacao/criando-aplicativo
- Libere os escopos **booking.show building.show organization.show**:
- Copie o **clientid**, **client_secret** e os **escopos** para os atributos **DESKO_API_CLIENT_ID** e **DESKO_API_CLIENT_SECRET** no .env
- Crie um WebHook no Painel Desko, conforme documentação: https://developers.desko.com.br/webhook-iniciando
- Copie a Chave de Assinatura no atributo **SIGNATURE** no .env
```

- **OBS** O Servidor IdSecure terá que liberar a porta configurada no atrtibuto **PORT** do .env para a internet, podendo restrigir o acesso via Firewall.

5. Configurando banco de dado

- Informe no .env os dados de conexão Banco de dados; **DB_MYSQL_***
- Configure o .env informando os dados de conexao Banco de Dados do ControlID **CONTROLID_MYSQL_HOST**

6. Execute as Migrations
```
$ node ace migration:run no-plugins
```

7. Rodando Aplicaco
```
$ node server.js
```

O servidor inciará na porta:3000 - acesse <http://<ip da maquina>:3000/ping> para testar


## Instalando como Serviço no Windows:

```
$ npm i -g node-windows@1.0.0-beta.6
$ npm link node-windows

node install-windows-service.js
node unistall-windows-service.js
```

### 🛠 Tecnologias

As seguintes ferramentas foram usadas na construção do projeto:

- [Node.js](https://nodejs.org/en/)
- [AdonisJs](https://adonisjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Axios](https://github.com/axios/axios)

