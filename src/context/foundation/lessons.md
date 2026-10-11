# Lessons Learned

Ten plik zawiera lekcje wyciagniete z pracy nad projektem.
Dopisywane na koncu, nie sortowane.

---

## Uzywaj Zod do walidacji requestow

- **Context**: Implementacja endpointow API w Express
- **Problem**: Bez walidacji agent moze generowac kod przyjmujacy niepoprawne dane
- **Rule**: Kazdy endpoint POST/PUT musi miec Zod schema dla body
- **Applies to**: implement, impl-review

---

## Sprawdzaj uprawnienia przed dostepem do danych

- **Context**: Endpointy RBAC-protected
- **Problem**: Agent moze pominac sprawdzenie uprawnien przy szybkiej implementacji
- **Rule**: Uzywaj middleware requirePermission() dla chronionych endpointow
- **Applies to**: implement, impl-review

---

## Terminal state w JSON, nie w osobnych tabelach

- **Context**: Przechowywanie stanu terminala (filesystem, env)
- **Problem**: Normalizacja stanu terminala do tabel komplikuje kod
- **Rule**: Przechowuj fileSystem i environment jako JSON w Prisma
- **Applies to**: plan, implement
