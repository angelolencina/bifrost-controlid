# Desko Bifrost + IdSecure / ControlId

🚧  🚀 Em construção :: Prova de Conceito ...  🚧

## Descrição do Projeto

Bifrost é um micro-serviço com a capacidade se ser a ponte que estabelece a ligação entre o Desko e Outros Sistemas.

Esta versão é compatível com IdSecure da ControlId: https://www.controlid.com.br/docs/idsecure-pt/

### Pré-requisitos

Para ambiente Dev, você vai precisar ter instalado em sua máquina as seguintes ferramentas:
- [Git](https://git-scm.com)
  - [windows] (https://github.com/git-for-windows/git/releases/download/v2.38.1.windows.1/Git-2.38.1-64-bit.exe)
- [Node.js](https://nodejs.org/en/).
  - [windows] (https://nodejs.org/dist/v14.20.0/node-v14.20.0-x64.msi)
- [VSCode](https://code.visualstudio.com/)
- [HeidiSQL](https://www.heidisql.com/download.php)
### 🎲 Rodando Serviço

Este Gateway deverá ser instalado na mesma máquina na qual o IdSecure foi instalado:

```

2. Faça checkout do Projeto e instale as dependencias

```bash
$ npm ci --production
$ npm run build
$ npm i -g pm2
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
- Copie o **clientid**, **client_secret** e os **escopos** para os atributos **DESKBEE_API_CLIENT_ID** e **DESKBEE_API_CLIENT_SECRET** no .env
- Crie um WebHook no Painel Desko, conforme documentação: https://developers.desko.com.br/webhook-iniciando
- Copie a Chave de Assinatura no atributo **SIGNATURE** no .env
```

- **OBS** O Servidor IdSecure terá que liberar a porta configurada no atrtibuto **PORT** do .env para a internet, podendo restrigir o acesso via Firewall.

5. Configurando banco de dado

- Informe no .env os dados de conexão Banco de dados; **DB_MYSQL_***
- Configure o .env informando os dados de conexao Banco de Dados do ControlID **CONTROLID_MYSQL_HOST**

6. Inicie o Ser

```bash

6. Crie um nova pasta **C:\etc\.pm2**
- crie uma pasta para gravar os logs do pm2  C:\etc\.pm2

7. Rodando Aplicaco
```
$ ./pm2_start_up.sh
```

O servidor inciará na porta:3000 - acesse <http://<ip da maquina>:3000/ping> para testar


## Criando uma tarefa agendada( Task manager ) no Windows:

```
Create Task Scheduler
Open Task Scheduler and click ‘Create Task’.
Fill the task name and choose ‘Run whether user is logged on or not’
Move to the next tab, add new Trigger. Set the begin task ‘At Startup’ and click OK.
Add new Action to Start a Program and browse the Batch File Location (“pm2_startup.bat”) and click OK.
Left the check fields inside Conditions tab unchecked.
After all is set, then click OK to create this Task.
```

### 🛠 Tecnologias

As seguintes ferramentas foram usadas na construção do projeto:

- [Node.js](https://nodejs.org/en/)
- [AdonisJs](https://adonisjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Axios](https://github.com/axios/axios)


git update-index --assume-unchanged

