# KC.dev | Portfólio de Engenharia de Software

Muito mais do que um site de apresentação, este projeto é um *case* prático de engenharia front-end, arquitetura de software e otimização de performance. 

Desenvolvido para refletir a mentalidade de um Engenheiro de Software focado nos fundamentos da máquina, este portfólio descarta o uso de *frameworks* pesados (como React ou Vue) em favor da raiz da linguagem: **Vanilla JavaScript**, manipulação direta do DOM e APIs nativas do navegador. O resultado é uma aplicação que carrega em milissegundos e roda com eficiência máxima.

## ⚙️ Destaques da Arquitetura

* **Web Components Nativos:** Uso de Custom Elements (`<project-card>`) com encapsulamento via Shadow DOM, demonstrando controle profundo sobre a estrutura do HTML sem dependências externas.
* **View Transitions API:** Transições de estado fluidas e nativas (sem bibliotecas de animação) para o Drawer de arquitetura e Modo Terminal.
* **Modo Terminal (CLI):** Uma interface de linha de comando construída do zero, permitindo ao usuário interagir com o site rodando comandos como `ls`, `whoami` e `ping`.
* **Telemetria em Tempo Real:** Um widget fixo que simula o monitoramento de recursos e uptime, refletindo o background em infraestrutura e redes.
* **Integração Dinâmica (GitHub API):** Fetch automático dos repositórios públicos mais recentes, mantendo o portfólio sempre atualizado a cada novo *commit*.
* **Otimização de Performance:** PWA configurado com Service Worker (`sw.js`) para *cache-first* e suporte offline.
* **Easter Eggs:** Jogo Pong autônomo (renderizado via API Canvas interagindo com a grade de pixels).

## 🛠️ Stack Tecnológico
* HTML5 (Semântico e Acessível)
* CSS3 (Propriedades lógicas, Variáveis Nativas e Animações via IntersectionObserver)
* Vanilla JavaScript (ES6+)
* APIs Web: Canvas, Web Components, View Transitions, Fetch API

---
*"Talk is cheap. Show me the code."* — Linus Torvalds
