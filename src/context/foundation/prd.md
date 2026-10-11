# CloudShell - Product Requirements Document

## Overview
System emulujacy zachowanie CloudShell z nastepujacymi glownymi funkcjonalnosciami:
- Role-Based Access Control (RBAC)
- Emulowane terminale z podstawowymi komendami Linux
- Snapshoty stanu terminali

## Problem Statement
Potrzeba srodowiska do nauki i testowania operacji terminalowych w bezpiecznym, izolowanym srodowisku bez ryzyka uszkodzenia rzeczywistych systemow.

## Target Users
1. **Administratorzy** - zarzadzanie uzytkownikami i rolami
2. **Operatorzy** - tworzenie i zarzadzanie terminalami
3. **Viewers** - podglad stanu terminali

## Core Features

### 1. RBAC System
- Trzy role: admin, operator, viewer
- Granularne uprawnienia na poziomie resource:action
- Zarzadzanie uzytkownikami przez admina

### 2. Terminal Emulator
- Emulacja podstawowych komend Linux (ls, cd, cat, echo, pwd, mkdir, touch, rm, env, export, whoami, date, help, clear)
- Wirtualny filesystem
- Historia komend
- Zmienne srodowiskowe

### 3. Status Snapshots
- Zapisywanie stanu terminala (filesystem, env, working dir)
- Przywracanie stanu z snapshota
- Metadane snapshota (nazwa, data, terminal)

## Non-Functional Requirements
- Docker-based infrastructure
- RHEL-based build agents
- PostgreSQL for persistence
- Redis for caching/sessions

## Success Metrics
- Uzytkownik moze utworzyc terminal i wykonac podstawowe komendy
- Stan terminala moze byc zapisany i przywrocony
- System uprawnien dziala poprawnie dla wszystkich rol

## Out of Scope (MVP)
- Real shell execution
- File uploads
- Multi-user terminal sessions
- Terminal resize/customization
