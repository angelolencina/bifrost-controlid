# Desko Bifrost / IdSecure

🚧  🚀 Em construção...  🚧

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

- Conecte no Banco de Dados MySql  do Id Secure e crie uma database
```
CREATE DATABASE desko_controlid
```

- Faça checkout do Projeto e instale as dependencias

```bash
$ git clone <https://github.com/deskbee/bifrost-controlid>

$ cd bifrost-controlid

$ npm install
```

- Configurar .env
```
$ cp .env-example .env

$ node bifrost generate key
```

- Copie o APP_KEY no .env
- Acesse o Painel Desko https://painel.desko.com.br
- Crie um Aplicativo Client conforme documentação, liberando os escopos **booking.show building.show**: https://developers.desko.com.br/referencia-api/autenticacao/criando-aplicativo
- Copie o **clientid**, **client_secret** e os **escopos** para os atributos **DESKO_API_CLIENT_ID** e **DESKO_API_CLIENT_SECRET** no .env
- Crie um WebHook no Painel Desko, conforme documentação: https://developers.desko.com.br/webhook-iniciando

- **OBS** O Servidor IdSecure terá que liberar a porta configurada no atrtibuto **PORT** do .env para a internet, podendo restrigir o acesso via Firewall.

- Copie a Chave de Assinatura no atributo **SIGNATURE** no .env

- Informe no .env os dados de conexão Banco de dados; **DB_MYSQL_***

- Configure o .env informando os dados de conexao Banco de Dados do ControlID **CONTROLID_MYSQL_HOST**

- Execute as Migrations
```
$ node ace migration:run no-plugins
```

```
$ node bifrost serve
```

O servidor inciará na porta:3000 - acesse <http://<ip da maquina>:3000/ping> para testar


## Instalando como Serviço no Windows:

```
$ npm install -g node-windows
$ npm link node-windows

node installl-windows-service.js
node unistall-windows-service.js
```

### 🛠 Tecnologias

As seguintes ferramentas foram usadas na construção do projeto:

- [Node.js](https://nodejs.org/en/)
- [AdonisJs](https://adonisjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Axios](https://github.com/axios/axios)

