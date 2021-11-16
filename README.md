# Desko Bifrost

🚧  🚀 Em construção...  🚧

## Descrição do Projeto

Bifrost é um micro-serviço com a capacidade se ser a ponte que estabelece a ligação entre o Desko e Outros Sistemas.

### Features

- [x] Fluxo e API de Comunicação com o Desko via WebHook e Api

### Pré-requisitos

Antes de começar, você vai precisar ter instalado em sua máquina as seguintes ferramentas:
[Git](https://git-scm.com), [Node.js](https://nodejs.org/en/). 
Além disto é bom ter um editor para trabalhar com o código como [VSCode](https://code.visualstudio.com/)

### 🎲 Rodando o Back End (servidor)

Conectar banco ControlId, criar database

```
CREATE DATABASE desko_controlid
```



```bash
$ git clone <https://github.com/deskbee/bifrost-controlid>

$ cd bifrost

$ npm install

** Configurar .env **

$ node ace generate key

$ node ace migration:run

$ node ace serve

# O servidor inciará na porta:3000 - acesse <http://localhost:3000>
```

### 🛠 Tecnologias

As seguintes ferramentas foram usadas na construção do projeto:

- [Node.js](https://nodejs.org/en/)
- [AdonisJs](https://adonisjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Axios](https://github.com/axios/axios)

