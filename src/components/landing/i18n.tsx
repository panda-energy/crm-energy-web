"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type LandingLocale = "es" | "en" | "pt" | "fr";

const LABELS: Record<LandingLocale, string> = {
  es: "ES",
  en: "EN",
  pt: "PT",
  fr: "FR",
};

// -- Translations dictionary --------------------------------------------------

const dict = {
  nav: {
    product: { es: "Producto", en: "Product", pt: "Produto", fr: "Produit" },
    ai: { es: "IA", en: "AI", pt: "IA", fr: "IA" },
    integrations: { es: "Integraciones", en: "Integrations", pt: "Integrações", fr: "Intégrations" },
    security: { es: "Seguridad", en: "Security", pt: "Segurança", fr: "Sécurité" },
    pricing: { es: "Precios", en: "Pricing", pt: "Preços", fr: "Tarifs" },
    faq: { es: "FAQ", en: "FAQ", pt: "FAQ", fr: "FAQ" },
    signIn: { es: "Iniciar sesion", en: "Sign in", pt: "Entrar", fr: "Connexion" },
    requestDemo: { es: "Solicitar demo", en: "Request demo", pt: "Solicitar demo", fr: "Demander une démo" },
  },
  hero: {
    badge: {
      es: "Sector energetico europeo",
      en: "European energy sector",
      pt: "Setor energetico europeu",
      fr: "Secteur énergétique européen",
    },
    headline: {
      es: "El CRM con IA que las comercializadoras de energia estaban esperando",
      en: "The AI-powered CRM energy retailers have been waiting for",
      pt: "O CRM com IA que as comercializadoras de energia estavam esperando",
      fr: "Le CRM avec IA que les fournisseurs d'énergie attendaient",
    },
    aiWord: { es: "IA", en: "AI-powered", pt: "IA", fr: "IA" },
    sub: {
      es: "Automatiza procesos ATR, captura leads por WhatsApp, firma contratos digitalmente y gestiona toda tu cartera desde una unica plataforma inteligente.",
      en: "Automate ATR processes, capture leads via WhatsApp, sign contracts digitally and manage your entire portfolio from a single intelligent platform.",
      pt: "Automatize processos ATR, capture leads pelo WhatsApp, assine contratos digitalmente e gerencie toda a sua carteira a partir de uma unica plataforma inteligente.",
      fr: "Automatisez les processus ATR, capturez des leads via WhatsApp, signez des contrats numériquement et gérez tout votre portefeuille depuis une plateforme intelligente unique.",
    },
    cta1: { es: "Solicitar demo", en: "Request demo", pt: "Solicitar demo", fr: "Demander une démo" },
    cta2: { es: "Ver producto", en: "See product", pt: "Ver produto", fr: "Voir le produit" },
    stats: {
      distributors: { es: "distribuidoras conectadas", en: "connected distributors", pt: "distribuidoras conectadas", fr: "distributeurs connectés" },
      latency: { es: "latencia p95", en: "p95 latency", pt: "latência p95", fr: "latence p95" },
      uptime: { es: "uptime SLO", en: "uptime SLO", pt: "uptime SLO", fr: "uptime SLO" },
      rgpd: { es: "compliant", en: "compliant", pt: "compliant", fr: "conforme" },
    },
  },
  pain: {
    label: { es: "El problema", en: "The problem", pt: "O problema", fr: "Le problème" },
    title: {
      es: "Las comercializadoras pierden tiempo",
      en: "Energy retailers waste time",
      pt: "As comercializadoras perdem tempo",
      fr: "Les fournisseurs perdent du temps",
    },
    titleFaded: {
      es: "(y contratos)",
      en: "(and contracts)",
      pt: "(e contratos)",
      fr: "(et des contrats)",
    },
    titleEnd: {
      es: "con herramientas que no entienden su negocio",
      en: "with tools that don't understand their business",
      pt: "com ferramentas que nao entendem seu negocio",
      fr: "avec des outils qui ne comprennent pas leur métier",
    },
    items: [
      {
        title: { es: "Procesos ATR manuales", en: "Manual ATR processes", pt: "Processos ATR manuais", fr: "Processus ATR manuels" },
        desc: {
          es: "Generar XMLs a mano, enviar por SFTP, rastrear respuestas en bandejas de correo. Errores constantes, rechazos evitables, horas perdidas.",
          en: "Generate XMLs by hand, send via SFTP, track responses in inboxes. Constant errors, avoidable rejections, wasted hours.",
          pt: "Gerar XMLs a mao, enviar por SFTP, rastrear respostas em caixas de correio. Erros constantes, rejeições evitaveis, horas perdidas.",
          fr: "Générer des XML à la main, envoyer par SFTP, suivre les réponses dans les boîtes mail. Erreurs constantes, rejets évitables, heures perdues.",
        },
      },
      {
        title: { es: "Informacion dispersa", en: "Scattered information", pt: "Informação dispersa", fr: "Information dispersée" },
        desc: {
          es: "Excel de leads, PDF de contratos, correos con distribuidoras, WhatsApp con clientes. Nada conectado, nada trazable.",
          en: "Lead spreadsheets, contract PDFs, emails with distributors, WhatsApp with clients. Nothing connected, nothing traceable.",
          pt: "Excel de leads, PDF de contratos, e-mails com distribuidoras, WhatsApp com clientes. Nada conectado, nada rastreavel.",
          fr: "Excel de leads, PDF de contrats, emails avec les distributeurs, WhatsApp avec les clients. Rien de connecté, rien de traçable.",
        },
      },
      {
        title: { es: "Equipos de campo sin herramientas", en: "Field teams without tools", pt: "Equipes de campo sem ferramentas", fr: "Équipes terrain sans outils" },
        desc: {
          es: "Comerciales que vuelven a la oficina para cargar datos. Oportunidades que se enfrian mientras el lead espera.",
          en: "Sales reps returning to the office to enter data. Opportunities going cold while leads wait.",
          pt: "Comerciais que voltam ao escritorio para carregar dados. Oportunidades que esfriam enquanto o lead espera.",
          fr: "Des commerciaux qui retournent au bureau pour saisir des données. Des opportunités qui refroidissent pendant que le lead attend.",
        },
      },
      {
        title: { es: '"IA de juguete"', en: '"Toy AI"', pt: '"IA de brinquedo"', fr: '"IA gadget"' },
        desc: {
          es: "Chatbots que no saben que es un CUPS, un C1 o una tarifa 2.0TD. Automatizacion cosmetica que no mueve la aguja.",
          en: "Chatbots that don't know what a CUPS, C1 or 2.0TD tariff is. Cosmetic automation that doesn't move the needle.",
          pt: "Chatbots que nao sabem o que e um CUPS, um C1 ou uma tarifa 2.0TD. Automação cosmetica que nao move a agulha.",
          fr: "Des chatbots qui ne savent pas ce qu'est un CUPS, un C1 ou un tarif 2.0TD. Une automatisation cosmétique qui ne change rien.",
        },
      },
    ],
  },
  solution: {
    label: { es: "La solucion", en: "The solution", pt: "A solução", fr: "La solution" },
    title: { es: "Todo el ciclo de vida del cliente.", en: "The entire customer lifecycle.", pt: "Todo o ciclo de vida do cliente.", fr: "Tout le cycle de vie client." },
    titleHighlight: { es: "Una sola plataforma.", en: "One single platform.", pt: "Uma unica plataforma.", fr: "Une seule plateforme." },
    steps: {
      es: ["Lead", "SIPS", "Simulacion", "Oferta", "Firma", "ATR", "Activo", "Portal"],
      en: ["Lead", "SIPS", "Simulation", "Offer", "Signing", "ATR", "Active", "Portal"],
      pt: ["Lead", "SIPS", "Simulação", "Oferta", "Assinatura", "ATR", "Ativo", "Portal"],
      fr: ["Lead", "SIPS", "Simulation", "Offre", "Signature", "ATR", "Actif", "Portail"],
    },
    footnote: {
      es: "Desde la captacion del lead hasta el autoservicio del cliente final. Todo automatizado, todo trazable.",
      en: "From lead capture to customer self-service. Fully automated, fully traceable.",
      pt: "Da captação do lead ao autoatendimento do cliente final. Tudo automatizado, tudo rastreavel.",
      fr: "De la captation du lead au libre-service client. Entièrement automatisé, entièrement traçable.",
    },
  },
  modules: {
    label: { es: "Modulos", en: "Modules", pt: "Modulos", fr: "Modules" },
    title: { es: "10 modulos.", en: "10 modules.", pt: "10 modulos.", fr: "10 modules." },
    titleFaded: {
      es: "Cero integraciones que mantener.",
      en: "Zero integrations to maintain.",
      pt: "Zero integrações para manter.",
      fr: "Zéro intégration à maintenir.",
    },
    items: [
      { name: { es: "Leads y captacion", en: "Leads & capture", pt: "Leads e captação", fr: "Leads & acquisition" }, desc: { es: "WhatsApp, formulario, CSV. Enrichment automatico, acciones en lote, barra de comandos rapida.", en: "WhatsApp, forms, CSV. Auto enrichment, bulk actions, command bar.", pt: "WhatsApp, formulario, CSV. Enriquecimento automatico, ações em lote, barra de comandos.", fr: "WhatsApp, formulaire, CSV. Enrichissement auto, actions groupées, barre de commandes." } },
      { name: { es: "Pipeline visual", en: "Visual pipeline", pt: "Pipeline visual", fr: "Pipeline visuel" }, desc: { es: "Kanban drag & drop. Etapas configurables por comercializadora.", en: "Kanban drag & drop. Stages configurable per retailer.", pt: "Kanban drag & drop. Etapas configuraveis por comercializadora.", fr: "Kanban drag & drop. Étapes configurables par fournisseur." } },
      { name: { es: "CUPS y SIPS", en: "CUPS & SIPS", pt: "CUPS e SIPS", fr: "CUPS & SIPS" }, desc: { es: "Consulta oficial con un clic. Distribuidora, potencia, tarifa, consumo.", en: "Official lookup in one click. Distributor, power, tariff, consumption.", pt: "Consulta oficial com um clique. Distribuidora, potência, tarifa, consumo.", fr: "Consultation officielle en un clic. Distributeur, puissance, tarif, consommation." } },
      { name: { es: "Contratos y firma", en: "Contracts & signing", pt: "Contratos e assinatura", fr: "Contrats & signature" }, desc: { es: "Wizard guiado. PDF auto-generado. Firma remota eIDAS o presencial en pantalla.", en: "Guided wizard. Auto-generated PDF. Remote eIDAS or on-screen signing.", pt: "Wizard guiado. PDF auto-gerado. Assinatura remota eIDAS ou presencial.", fr: "Assistant guidé. PDF auto-généré. Signature distante eIDAS ou sur écran." } },
      { name: { es: "ATR y switching", en: "ATR & switching", pt: "ATR e switching", fr: "ATR & switching" }, desc: { es: "XML CNMC automatico. Envio SFTP a 5 distribuidoras. Tracking y reintentos.", en: "Automatic CNMC XML. SFTP to 5 distributors. Tracking & retries.", pt: "XML CNMC automatico. Envio SFTP a 5 distribuidoras. Tracking e retentativas.", fr: "XML CNMC automatique. Envoi SFTP à 5 distributeurs. Suivi & réessais." } },
      { name: { es: "Agentes IA", en: "AI Agents", pt: "Agentes IA", fr: "Agents IA" }, desc: { es: "Lead Concierge + ATR Back-office. Supervision humana. Trazabilidad completa.", en: "Lead Concierge + ATR Back-office. Human oversight. Full traceability.", pt: "Lead Concierge + ATR Back-office. Supervisão humana. Rastreabilidade completa.", fr: "Lead Concierge + ATR Back-office. Supervision humaine. Traçabilité complète." } },
      { name: { es: "Atencion al cliente", en: "Customer support", pt: "Atendimento ao cliente", fr: "Support client" }, desc: { es: "Bandeja unificada. SLA visual. Historial 360.", en: "Unified inbox. Visual SLA. 360 history.", pt: "Caixa unificada. SLA visual. Historico 360.", fr: "Boîte unifiée. SLA visuel. Historique 360." } },
      { name: { es: "Canales y comisiones", en: "Channels & commissions", pt: "Canais e comissões", fr: "Canaux & commissions" }, desc: { es: "Brokers, marca blanca. Calculo y liquidacion automatica.", en: "Brokers, white label. Auto calculation & settlement.", pt: "Brokers, marca branca. Calculo e liquidação automatica.", fr: "Courtiers, marque blanche. Calcul & règlement automatique." } },
      { name: { es: "Portal cliente", en: "Customer portal", pt: "Portal do cliente", fr: "Portail client" }, desc: { es: "Consumo, facturas, potencia. Personalizable con tu marca.", en: "Consumption, invoices, power. Customizable with your brand.", pt: "Consumo, faturas, potência. Personalizavel com sua marca.", fr: "Consommation, factures, puissance. Personnalisable à votre marque." } },
      { name: { es: "App movil", en: "Mobile app", pt: "App movel", fr: "App mobile" }, desc: { es: "Escanear factura, simular, firmar. Flujo completo en campo.", en: "Scan invoice, simulate, sign. Full flow in the field.", pt: "Escanear fatura, simular, assinar. Fluxo completo em campo.", fr: "Scanner facture, simuler, signer. Flux complet sur le terrain." } },
    ],
  },
  ai: {
    badge: { es: "Inteligencia artificial", en: "Artificial intelligence", pt: "Inteligência artificial", fr: "Intelligence artificielle" },
    title: { es: "IA que entiende de energia.", en: "AI that understands energy.", pt: "IA que entende de energia.", fr: "Une IA qui comprend l'énergie." },
    titleFaded: { es: "No decoracion.", en: "Not decoration.", pt: "Não decoração.", fr: "Pas de la décoration." },
    sub: {
      es: "Agentes autonomos entrenados en procesos reales del sector energetico. Powered by Claude (Anthropic) con fallback OpenAI. Trazabilidad completa con Langfuse.",
      en: "Autonomous agents trained on real energy sector processes. Powered by Claude (Anthropic) with OpenAI fallback. Full traceability with Langfuse.",
      pt: "Agentes autônomos treinados em processos reais do setor energetico. Powered by Claude (Anthropic) com fallback OpenAI. Rastreabilidade completa com Langfuse.",
      fr: "Agents autonomes entraînés sur des processus réels du secteur énergétique. Powered by Claude (Anthropic) avec fallback OpenAI. Traçabilité complète avec Langfuse.",
    },
    features: [
      { title: { es: "Lead Concierge", en: "Lead Concierge", pt: "Lead Concierge", fr: "Lead Concierge" }, desc: { es: "Atiende WhatsApp 24/7. Califica, consulta SIPS, simula ahorros y genera ofertas automaticamente.", en: "Handles WhatsApp 24/7. Qualifies, queries SIPS, simulates savings and generates offers automatically.", pt: "Atende WhatsApp 24/7. Qualifica, consulta SIPS, simula economias e gera ofertas automaticamente.", fr: "Gère WhatsApp 24/7. Qualifie, consulte SIPS, simule les économies et génère des offres automatiquement." } },
      { title: { es: "ATR Back-office", en: "ATR Back-office", pt: "ATR Back-office", fr: "ATR Back-office" }, desc: { es: "Analiza rechazos de distribuidoras, identifica el error exacto y propone la correccion.", en: "Analyzes distributor rejections, identifies the exact error and proposes the fix.", pt: "Analisa rejeições de distribuidoras, identifica o erro exato e propõe a correção.", fr: "Analyse les rejets des distributeurs, identifie l'erreur exacte et propose la correction." } },
      { title: { es: "Human-in-the-loop", en: "Human-in-the-loop", pt: "Human-in-the-loop", fr: "Human-in-the-loop" }, desc: { es: "Supervision humana obligatoria para acciones criticas. Cada accion queda registrada con coste y resultado.", en: "Mandatory human oversight for critical actions. Every action logged with cost and outcome.", pt: "Supervisão humana obrigatoria para ações criticas. Cada ação registrada com custo e resultado.", fr: "Supervision humaine obligatoire pour les actions critiques. Chaque action enregistrée avec coût et résultat." } },
    ],
  },
  integrations: {
    label: { es: "Integraciones", en: "Integrations", pt: "Integrações", fr: "Intégrations" },
    title: { es: "Conectado con todo lo que necesitas", en: "Connected to everything you need", pt: "Conectado com tudo que voce precisa", fr: "Connecté à tout ce dont vous avez besoin" },
  },
  security: {
    label: { es: "Seguridad", en: "Security", pt: "Segurança", fr: "Sécurité" },
    title: { es: "Tus datos. Tu control.", en: "Your data. Your control.", pt: "Seus dados. Seu controle.", fr: "Vos données. Votre contrôle." },
    titleFaded: { es: "Nuestra obsesion.", en: "Our obsession.", pt: "Nossa obsessão.", fr: "Notre obsession." },
    badges: [
      { label: { es: "RGPD compliant", en: "GDPR compliant", pt: "RGPD compliant", fr: "RGPD conforme" }, desc: { es: "Acceso, portabilidad y supresion de datos", en: "Access, portability and data deletion", pt: "Acesso, portabilidade e eliminação de dados", fr: "Accès, portabilité et suppression des données" } },
      { label: { es: "Datos en la UE", en: "Data in the EU", pt: "Dados na UE", fr: "Données dans l'UE" }, desc: { es: "Almacenamiento exclusivo en centros europeos", en: "Exclusive storage in European data centers", pt: "Armazenamento exclusivo em centros europeus", fr: "Stockage exclusif dans des centres européens" } },
      { label: { es: "Aislamiento total", en: "Total isolation", pt: "Isolamento total", fr: "Isolation totale" }, desc: { es: "Row-Level Security entre comercializadoras", en: "Row-Level Security between retailers", pt: "Row-Level Security entre comercializadoras", fr: "Row-Level Security entre fournisseurs" } },
      { label: { es: "Cifrado extremo", en: "End-to-end encryption", pt: "Criptografia extrema", fr: "Chiffrement de bout en bout" }, desc: { es: "HTTPS en transito, cifrado en reposo", en: "HTTPS in transit, encrypted at rest", pt: "HTTPS em trânsito, criptografado em repouso", fr: "HTTPS en transit, chiffré au repos" } },
      { label: { es: "Firma legal eIDAS", en: "eIDAS legal signing", pt: "Assinatura legal eIDAS", fr: "Signature légale eIDAS" }, desc: { es: "Validez juridica en toda la Union Europea", en: "Legal validity across the European Union", pt: "Validade juridica em toda a União Europeia", fr: "Validité juridique dans toute l'Union européenne" } },
      { label: { es: "WAF + rate limiting", en: "WAF + rate limiting", pt: "WAF + rate limiting", fr: "WAF + rate limiting" }, desc: { es: "Cloudflare con reglas OWASP y geo-restriccion", en: "Cloudflare with OWASP rules and geo-restriction", pt: "Cloudflare com regras OWASP e geo-restrição", fr: "Cloudflare avec règles OWASP et géo-restriction" } },
      { label: { es: "Backups automaticos", en: "Automatic backups", pt: "Backups automaticos", fr: "Sauvegardes automatiques" }, desc: { es: "Copias semanales en Cloudflare R2 EU", en: "Weekly copies in Cloudflare R2 EU", pt: "Copias semanais em Cloudflare R2 EU", fr: "Copies hebdomadaires dans Cloudflare R2 EU" } },
      { label: { es: "Auditorias IA", en: "AI auditing", pt: "Auditorias IA", fr: "Audits IA" }, desc: { es: "Cada accion de agentes registrada y trazable", en: "Every agent action logged and traceable", pt: "Cada ação de agentes registrada e rastreavel", fr: "Chaque action d'agent enregistrée et traçable" } },
    ],
  },
  metrics: {
    title: { es: "Numeros que hablan", en: "Numbers that speak", pt: "Numeros que falam", fr: "Des chiffres qui parlent" },
    items: [
      { label: { es: "distribuidoras conectadas", en: "connected distributors", pt: "distribuidoras conectadas", fr: "distributeurs connectés" }, detail: { es: ">80% mercado espanol", en: ">80% Spanish market", pt: ">80% mercado espanhol", fr: ">80% du marché espagnol" } },
      { label: { es: "flujos ATR automatizados", en: "automated ATR flows", pt: "fluxos ATR automatizados", fr: "flux ATR automatisés" }, detail: { es: "C1, A3, B1", en: "C1, A3, B1", pt: "C1, A3, B1", fr: "C1, A3, B1" } },
      { label: { es: "tests automatizados", en: "automated tests", pt: "testes automatizados", fr: "tests automatisés" }, detail: { es: "backend + integracion", en: "backend + integration", pt: "backend + integração", fr: "backend + intégration" } },
      { label: { es: "modulos integrados", en: "integrated modules", pt: "modulos integrados", fr: "modules intégrés" }, detail: { es: "zero integraciones externas", en: "zero external integrations", pt: "zero integrações externas", fr: "zéro intégration externe" } },
      { label: { es: "latencia p95", en: "p95 latency", pt: "latência p95", fr: "latence p95" }, detail: { es: "respuesta garantizada", en: "guaranteed response", pt: "resposta garantida", fr: "réponse garantie" } },
      { label: { es: "uptime SLO", en: "uptime SLO", pt: "uptime SLO", fr: "uptime SLO" }, detail: { es: "disponibilidad comprometida", en: "committed availability", pt: "disponibilidade comprometida", fr: "disponibilité engagée" } },
    ],
  },
  pricing: {
    label: { es: "Precios", en: "Pricing", pt: "Preços", fr: "Tarifs" },
    title: { es: "Simple, transparente, sin sorpresas", en: "Simple, transparent, no surprises", pt: "Simples, transparente, sem surpresas", fr: "Simple, transparent, sans surprises" },
    sub: { es: "Sin licencia inicial. Sin permanencia. Tus datos siempre exportables.", en: "No upfront license. No lock-in. Your data always exportable.", pt: "Sem licença inicial. Sem permanência. Seus dados sempre exportaveis.", fr: "Pas de licence initiale. Sans engagement. Vos données toujours exportables." },
    perMonth: { es: "EUR/mes", en: "EUR/mo", pt: "EUR/mês", fr: "EUR/mois" },
    custom: { es: "A medida", en: "Custom", pt: "Sob medida", fr: "Sur mesure" },
    plans: [
      {
        name: "Starter",
        price: "599",
        desc: { es: "Para comercializadoras que empiezan", en: "For energy retailers getting started", pt: "Para comercializadoras iniciantes", fr: "Pour les fournisseurs qui démarrent" },
        features: {
          es: ["Hasta 5.000 CUPS", "3 usuarios", "Leads, pipeline, CUPS, contratos", "ATR automatizado (C1, A3, B1)", "Soporte email"],
          en: ["Up to 5,000 CUPS", "3 users", "Leads, pipeline, CUPS, contracts", "Automated ATR (C1, A3, B1)", "Email support"],
          pt: ["Ate 5.000 CUPS", "3 usuarios", "Leads, pipeline, CUPS, contratos", "ATR automatizado (C1, A3, B1)", "Suporte email"],
          fr: ["Jusqu'à 5 000 CUPS", "3 utilisateurs", "Leads, pipeline, CUPS, contrats", "ATR automatisé (C1, A3, B1)", "Support email"],
        },
        cta: { es: "Empezar 14 dias gratis", en: "Start 14-day free trial", pt: "Começar 14 dias gratis", fr: "Essai gratuit 14 jours" },
      },
      {
        name: "Professional",
        price: "999",
        desc: { es: "Todo lo que necesitas para escalar", en: "Everything you need to scale", pt: "Tudo que voce precisa para escalar", fr: "Tout ce qu'il faut pour grandir" },
        features: {
          es: ["Hasta 50.000 CUPS", "15 usuarios", "Todos los modulos", "Agentes IA incluidos", "Portal cliente con tu marca", "App movil iOS y Android", "Soporte prioritario"],
          en: ["Up to 50,000 CUPS", "15 users", "All modules", "AI agents included", "Branded customer portal", "iOS & Android mobile app", "Priority support"],
          pt: ["Ate 50.000 CUPS", "15 usuarios", "Todos os modulos", "Agentes IA incluidos", "Portal do cliente com sua marca", "App movel iOS e Android", "Suporte prioritario"],
          fr: ["Jusqu'à 50 000 CUPS", "15 utilisateurs", "Tous les modules", "Agents IA inclus", "Portail client à votre marque", "App mobile iOS & Android", "Support prioritaire"],
        },
        cta: { es: "Solicitar demo", en: "Request demo", pt: "Solicitar demo", fr: "Demander une démo" },
        badge: { es: "Mas popular", en: "Most popular", pt: "Mais popular", fr: "Le plus populaire" },
      },
      {
        name: "Enterprise",
        price: "Custom",
        desc: { es: "Para grandes comercializadoras", en: "For large energy retailers", pt: "Para grandes comercializadoras", fr: "Pour les grands fournisseurs" },
        features: {
          es: ["CUPS ilimitados", "Usuarios ilimitados", "Todo lo de Professional", "SLA garantizado", "Onboarding dedicado", "API access completo", "Marca blanca total"],
          en: ["Unlimited CUPS", "Unlimited users", "Everything in Professional", "Guaranteed SLA", "Dedicated onboarding", "Full API access", "Complete white label"],
          pt: ["CUPS ilimitados", "Usuarios ilimitados", "Tudo do Professional", "SLA garantido", "Onboarding dedicado", "API access completo", "Marca branca total"],
          fr: ["CUPS illimités", "Utilisateurs illimités", "Tout Professional", "SLA garanti", "Onboarding dédié", "Accès API complet", "Marque blanche totale"],
        },
        cta: { es: "Hablar con ventas", en: "Talk to sales", pt: "Falar com vendas", fr: "Parler aux ventes" },
      },
    ],
  },
  faq: {
    title: { es: "Preguntas frecuentes", en: "Frequently asked questions", pt: "Perguntas frequentes", fr: "Questions fréquentes" },
    items: [
      { q: { es: "Que tipo de comercializadoras pueden usar Kuro?", en: "What type of energy retailers can use Kuro?", pt: "Que tipo de comercializadoras podem usar o Kuro?", fr: "Quel type de fournisseurs peut utiliser Kuro ?" }, a: { es: "Comercializadoras pequenas y medianas (5.000 a 200.000 CUPS), cooperativas energeticas, brokers, asesores energeticos y agregadores de comunidades energeticas.", en: "Small and medium energy retailers (5,000 to 200,000 CUPS), energy cooperatives, brokers, energy advisors and energy community aggregators.", pt: "Comercializadoras pequenas e medias (5.000 a 200.000 CUPS), cooperativas energeticas, brokers, consultores energeticos e agregadores de comunidades energeticas.", fr: "Fournisseurs petits et moyens (5 000 à 200 000 CUPS), coopératives énergétiques, courtiers, conseillers énergétiques et agrégateurs de communautés énergétiques." } },
      { q: { es: "Necesito instalar algo?", en: "Do I need to install anything?", pt: "Preciso instalar algo?", fr: "Dois-je installer quelque chose ?" }, a: { es: "No. Solo necesitas un navegador y conexion a internet. La app movil se descarga desde App Store o Google Play.", en: "No. You just need a browser and internet connection. The mobile app is available on App Store and Google Play.", pt: "Não. So precisa de um navegador e conexão com a internet. O app movel esta disponivel na App Store e Google Play.", fr: "Non. Vous avez juste besoin d'un navigateur et d'une connexion internet. L'app mobile est disponible sur App Store et Google Play." } },
      { q: { es: "Cuanto tarda la implementacion?", en: "How long does implementation take?", pt: "Quanto tempo leva a implementação?", fr: "Combien de temps dure l'implémentation ?" }, a: { es: "Entre 2 y 4 semanas, incluyendo migracion de datos, configuracion y formacion del equipo.", en: "Between 2 and 4 weeks, including data migration, setup and team training.", pt: "Entre 2 e 4 semanas, incluindo migração de dados, configuração e formação da equipe.", fr: "Entre 2 et 4 semaines, incluant la migration des données, la configuration et la formation de l'équipe." } },
      { q: { es: "Puedo personalizar con mi marca?", en: "Can I customize with my brand?", pt: "Posso personalizar com minha marca?", fr: "Puis-je personnaliser avec ma marque ?" }, a: { es: "Si. El portal del cliente, documentos (presupuestos, contratos) y canales de comunicacion pueden llevar tu logo y colores.", en: "Yes. The customer portal, documents (quotes, contracts) and communication channels can carry your logo and colors.", pt: "Sim. O portal do cliente, documentos (orçamentos, contratos) e canais de comunicação podem ter seu logo e cores.", fr: "Oui. Le portail client, les documents (devis, contrats) et les canaux de communication peuvent porter votre logo et vos couleurs." } },
      { q: { es: "Mis datos estan seguros?", en: "Is my data secure?", pt: "Meus dados estao seguros?", fr: "Mes données sont-elles sécurisées ?" }, a: { es: "Datos almacenados en la UE, aislamiento total entre comercializadoras (Row-Level Security), cifrado en transito y reposo, cumplimiento RGPD completo.", en: "Data stored in the EU, total isolation between retailers (Row-Level Security), encrypted in transit and at rest, full GDPR compliance.", pt: "Dados armazenados na UE, isolamento total entre comercializadoras (Row-Level Security), criptografia em trânsito e repouso, conformidade RGPD completa.", fr: "Données stockées dans l'UE, isolation totale entre fournisseurs (Row-Level Security), chiffrement en transit et au repos, conformité RGPD complète." } },
      { q: { es: "La IA toma decisiones sola?", en: "Does the AI make decisions on its own?", pt: "A IA toma decisões sozinha?", fr: "L'IA prend-elle des décisions seule ?" }, a: { es: "No. Los agentes IA operan con supervision humana obligatoria para acciones criticas. Cada accion queda registrada con trazabilidad completa.", en: "No. AI agents operate with mandatory human oversight for critical actions. Every action is logged with full traceability.", pt: "Não. Os agentes IA operam com supervisão humana obrigatoria para ações criticas. Cada ação fica registrada com rastreabilidade completa.", fr: "Non. Les agents IA opèrent avec une supervision humaine obligatoire pour les actions critiques. Chaque action est enregistrée avec une traçabilité complète." } },
      { q: { es: "Que distribuidoras estan soportadas?", en: "Which distributors are supported?", pt: "Quais distribuidoras são suportadas?", fr: "Quels distributeurs sont supportés ?" }, a: { es: "e-distribucion, i-DE, UFD, Viesgo y Begasa. Cobertura de mas del 80% del mercado espanol. Expansion europea en roadmap.", en: "e-distribucion, i-DE, UFD, Viesgo and Begasa. Coverage of over 80% of the Spanish market. European expansion on the roadmap.", pt: "e-distribucion, i-DE, UFD, Viesgo e Begasa. Cobertura de mais de 80% do mercado espanhol. Expansão europeia no roadmap.", fr: "e-distribucion, i-DE, UFD, Viesgo et Begasa. Couverture de plus de 80% du marché espagnol. Expansion européenne en roadmap." } },
      { q: { es: "Puedo probar antes de comprar?", en: "Can I try before buying?", pt: "Posso experimentar antes de comprar?", fr: "Puis-je essayer avant d'acheter ?" }, a: { es: "Si. Ofrecemos demo personalizada y piloto con grupo reducido antes de comprometer presupuesto. Sin permanencia.", en: "Yes. We offer personalized demos and pilot programs with small groups before committing budget. No lock-in.", pt: "Sim. Oferecemos demo personalizada e piloto com grupo reduzido antes de comprometer orçamento. Sem permanência.", fr: "Oui. Nous offrons des démos personnalisées et des programmes pilotes avec des groupes réduits avant d'engager un budget. Sans engagement." } },
    ],
  },
  cta: {
    title1: { es: "Deja de pelear con Excel", en: "Stop fighting with spreadsheets", pt: "Pare de lutar com Excel", fr: "Arrêtez de vous battre avec Excel" },
    title2: { es: "y empieza a", en: "and start", pt: "e comece a", fr: "et commencez à" },
    titleHighlight: { es: "vender energia", en: "selling energy", pt: "vender energia", fr: "vendre de l'énergie" },
    sub: {
      es: "Solicita tu demo personalizada y descubre como Kuro Energy transforma tus operaciones en semanas, no meses.",
      en: "Request your personalized demo and discover how Kuro Energy transforms your operations in weeks, not months.",
      pt: "Solicite sua demo personalizada e descubra como a Kuro Energy transforma suas operações em semanas, não meses.",
      fr: "Demandez votre démo personnalisée et découvrez comment Kuro Energy transforme vos opérations en semaines, pas en mois.",
    },
    btn1: { es: "Solicitar demo", en: "Request demo", pt: "Solicitar demo", fr: "Demander une démo" },
    btn2: { es: "Escribenos por WhatsApp", en: "Write us on WhatsApp", pt: "Escreva-nos pelo WhatsApp", fr: "Écrivez-nous sur WhatsApp" },
    footnote: {
      es: "Sin compromiso. Sin permanencia. Respuesta en menos de 24h.",
      en: "No commitment. No lock-in. Response within 24h.",
      pt: "Sem compromisso. Sem permanência. Resposta em menos de 24h.",
      fr: "Sans engagement. Sans permanence. Réponse sous 24h.",
    },
  },
  footer: {
    tagline: {
      es: "CRM con IA para comercializadoras de energia en Europa.",
      en: "AI-powered CRM for energy retailers across Europe.",
      pt: "CRM com IA para comercializadoras de energia na Europa.",
      fr: "CRM avec IA pour les fournisseurs d'énergie en Europe.",
    },
    rights: {
      es: "Todos los derechos reservados.",
      en: "All rights reserved.",
      pt: "Todos os direitos reservados.",
      fr: "Tous droits réservés.",
    },
    madeWith: {
      es: "Hecho con ❤️ y mucho ☕ para el sector energetico de Europa",
      en: "Made with ❤️ and lots of ☕ for the European energy sector",
      pt: "Feito com ❤️ e muito ☕ para o setor energetico da Europa",
      fr: "Fait avec ❤️ et beaucoup de ☕ pour le secteur énergétique européen",
    },
    columns: {
      product: { es: "Producto", en: "Product", pt: "Produto", fr: "Produit" },
      resources: { es: "Recursos", en: "Resources", pt: "Recursos", fr: "Ressources" },
      legal: { es: "Legal", en: "Legal", pt: "Legal", fr: "Légal" },
      contact: { es: "Contacto", en: "Contact", pt: "Contato", fr: "Contact" },
    },
  },
} as const;

// -- Context & hook -----------------------------------------------------------

const LandingI18nContext = createContext<LandingLocale>("es");

export function LandingI18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<LandingLocale>("es");

  return (
    <LandingI18nContext.Provider value={locale}>
      {children}
      <LocaleSwitcher locale={locale} setLocale={setLocale} />
    </LandingI18nContext.Provider>
  );
}

export function useLandingLocale() {
  return useContext(LandingI18nContext);
}

export function useLandingT() {
  const locale = useLandingLocale();
  const t = useCallback(
    <S extends string>(obj: Record<LandingLocale, S>): S => obj[locale],
    [locale],
  );
  return { t, locale, dict };
}

// -- Locale switcher (floating pill) ------------------------------------------

function LocaleSwitcher({
  locale,
  setLocale,
}: {
  locale: LandingLocale;
  setLocale: (l: LandingLocale) => void;
}) {
  const locales: LandingLocale[] = ["es", "en", "pt", "fr"];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-0.5 rounded-full border border-zinc-800/60 bg-zinc-900/90 p-1 backdrop-blur-xl">
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
            locale === l
              ? "bg-emerald-500 text-white"
              : "text-zinc-500 hover:text-white"
          }`}
          aria-label={`Switch to ${LABELS[l]}`}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
