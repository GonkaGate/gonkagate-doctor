# GonkaGate - Project Overview (Context)

**Status:** Living doc  
**Last updated:** 2026-02-08

This document provides product-level context for the GonkaGate CLI. For normative CLI behavior and UX examples, see `docs/prd.md`.

## 1) What it is (one paragraph)

GonkaGate is a USD-billing gateway to the Gonka Network: you get an OpenAI-compatible API and a normal API-product experience (API keys, clear errors, usage, prepaid USD balance), while the underlying crypto/network mechanics are hidden. The goal is to let teams and agencies connect to decentralized AI compute as easily as OpenAI, with transparent economics and without operational chaos.

## 2) Who it is for

**Primary: production AI builders (agencies and product teams)**

- AI/automation agencies that resell LLM functionality and have steady traffic
- SaaS teams whose inference unit economics do not work with existing providers

**Secondary: developers who want to use Gonka Network without the pain**

- already aware of Gonka Network and looking for a production-ready way to connect

## 3) The problem

1. **Inference cost eats margin.** As traffic grows, bills grow faster than revenue.
2. **Integration and migration friction.** Rewriting code and pipelines for new infrastructure is expensive.
3. **Operational complexity of decentralized networks.** Wallets, signatures, tokens, FX, "how to pay" and "how to account for it" is not what product teams want to spend time on.
4. **Lack of transparency.** It is hard to understand how the price is composed and where provider margin sits.

## 4) How we solve it (principles)

- **Drop-in OpenAI compatibility.** We support the OpenAI request/response shape and the familiar dev flow: SDK -> one base URL -> it works.
- **USD billing like a SaaS.** The user sees balance, prices, and charges in USD.
- **Transparent pricing structure.** We surface network cost and platform fee separately, with no magic in the final number.
- **Decentralized compute as infrastructure.** GonkaGate does not "resell a provider"; it standardizes access to the Gonka Network.

## 5) How it works (user journey)

1. The user signs up and tops up a prepaid USD balance (MVP may start with manual/semi-auto top-ups; self-serve payments can come later).
2. They create an API key.
3. In their code/pipeline they change `base_url` to the GonkaGate endpoint and pick an available model (model table and equivalence mapping).
4. They send requests in an OpenAI-compatible format.
5. In the dashboard they see:
   - current balance,
   - usage and charges,
   - transparent cost breakdown,
   - and (key) savings/benchmark comparisons based on real usage.

## 6) What the user gets (value)

- **Fast start:** typically "15 minutes to first request" instead of weeks of migration.
- **Financial clarity:** balance and costs in USD, easier for accounting and spend control.
- **Economics:** potential to materially reduce inference cost (depends on models and benchmark; we do not make fixed percentage claims publicly).
- **Low switching cost:** OpenAI compatibility simplifies fallback and multi-provider strategies on the client side.

## 7) What we do NOT do (product boundaries)

- We are **not** an LLM router/provider aggregator and **not** an "OpenRouter alternative".
- We are **not** an inference provider with our own farm; compute comes from the **Gonka Network**.
- We are **not** a crypto exchange or wallet. Our job is to make Gonka Network feel like a normal API product.

## 8) Monetization (high-level)

The model is built around two sources:

- deposit fee
- usage platform fee on top of network cost

## 9) Typical scenarios

- Automation and agents (n8n/Make/scripts): content generation, classification, RAG, support bots.
- SaaS features: chat support, summarization, data extraction, auto-replies to tickets.
- High-volume pipelines: batch processing and periodic jobs where cost per token is critical.

## 10) North Star (vision)

Make GonkaGate the payment and integration layer between traditional businesses and open (decentralized) AI infrastructure: Gonka Network, billed in USD.

## 11) Related docs (this repo)

- CLI behavioral spec (source of truth): `docs/prd.md`
- Getting started: `README.md`
