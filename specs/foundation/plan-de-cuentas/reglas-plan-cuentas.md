# Reglas iniciales del plan de cuentas

## Segmentación del código contable

Los códigos de cuenta en TADOR siguen la convención `[A][BBB][C][DDD]` (8 dígitos):

```
[A][BBB][C][DDD]
1    111   0   001

A   = 1 dígito — Clase contable
      1 = Activo, 2 = Pasivo, 4 = Ingreso, 6 = Gasto
BBB = 3 dígitos — Grupo contable (Cuenta Madre)
      Identifica la familia de cuentas (ej: 111 = Vivienda, 124 = Alimentación)
C   = 1 dígito — Scope
      0 = Global (CuentaGlobal — pre-seed del catálogo)
      1 = Usuario (CuentaUsuario — creada por el usuario)
DDD = 3 dígitos — Secuencia
      000 = la cuenta grupo (nunca es postable)
      001-999 = cuentas postables del grupo

Ejemplos:
  61240001 → Gasto(6) | Alimentación(124) | Global(0) | postable #1 = "Supermercado"
  11121001 → Activo(1) | Bancos(112) | Usuario(1) | cuenta #1 = "Banco Pichincha"
  41000000 → Ingreso(4) | Ingresos Activos(100) | Global(0) | grupo

Uso en plantillas:
  - Códigos con N3=0: el template referencia CuentaGlobal directamente
  - Códigos con N3=1: el template usa máscara (XXX), el frontend reemplaza con las
    cuentas del usuario que cuelgan de ese grupo

Nota: 9 cuentas del legacy no siguen esta convención (N3 != 0). Se mapean con el
campo `alcance` en CuentaGlobal. La recodificación se hará cuando toque migrar
datos legacy.

---

Este documento convierte el plan de cuentas legacy en una tabla revisable. No es el plan definitivo de TADOR; sirve para separar qué parece catálogo global y qué parece cuenta propia del usuario, preservando ID y código legacy para una migración futura.

## Reglas propuestas

- El plan de cuentas global debe estar mantenido por TADOR y servir como estructura común.
- El usuario debe crear cuentas propias sobre esa estructura, especialmente bancos, tarjetas, billeteras, inversiones, préstamos, cuentas puente y proyectos.
- Las cuentas `GRP` son agrupadoras y no deberían recibir líneas de asiento.
- Las cuentas `MOV` son cuentas finales o postables en el legacy.
- En TADOR, una cuenta postable debería guardar referencia al código e ID legacy cuando venga de migración.
- Hogar no debe mostrar códigos ni cuentas madre, aunque internamente se usen para ordenar.
- PRO puede mostrar código, cuenta madre y clasificación cuando ayude a registrar mejor.
- La columna `Alcance propuesto` es editable: el usuario revisará qué queda global y qué pertenece solo a su historial.

## Criterios iniciales de alcance

| Alcance propuesto | Significado |
|-------------------|-------------|
| `Global propuesta` | Cuenta que parece útil como catálogo base para todos o casi todos los usuarios. |
| `Usuario propuesta` | Cuenta que parece propia del usuario: banco real, tarjeta, persona, año, proyecto, puente o cuenta histórica. |
| `Sistema` | Cuenta técnica legacy o especial. |
| `Revisar` | No hay criterio suficiente o hay contradicción. |

## Alertas detectadas

- `appears_archived_or_historical`: 6
- `duplicate_or_reused_name`: 20
- `expense_name_suggests_loan_payment_review_principal_vs_interest`: 2
- `missing_legacy_group_parent`: 9
- `name_suggests_bank_but_parent_is_not_bank_group`: 3
- `name_suggests_credit_card_but_parent_is_not_credit_card_group`: 1
- `name_suggests_payable_but_parent_is_receivable_asset`: 1

Padres legacy referenciados pero no presentes como `GRP`: `21100000`, `61116000`, `61213000`, `61270000`, `62130000`.

## Tabla revisable

| Código legacy | ID legacy | Nombre | Nivel | Tipo | Clase sugerida | Naturaleza sugerida | Alcance propuesto | Revisión |
|---------------|-----------|--------|-------|------|----------------|---------------------|-------------------|----------|
| 00000001 | 1 | Traspaso | 0 | MOV | Sistema | system_template_account | Sistema |  |
| 00000002 | 2 | Saldo inicial | 0 | MOV | Sistema | system_template_account | Sistema |  |
| 11110000 | 3 | Honorarios por Cobrar | 1 | GRP | Activo | group | Global propuesta |  |
| 11110001 | 4 | Trabajos Realizados | 2 | MOV | Activo | uncategorized | Usuario propuesta |  |
| 11110002 | 5 | Trabajos Realizados 2022 | 2 | MOV | Activo | uncategorized | Usuario propuesta |  |
| 11110003 | 158 | Trabajos Realizados 2024 | 2 | MOV | Activo | uncategorized | Usuario propuesta | duplicate_or_reused_name |
| 11110004 | 168 | Trabajos Realizados 2025 | 2 | MOV | Activo | uncategorized | Usuario propuesta |  |
| 11120000 | 6 | Ahorros Bancos y Cooperativas | 1 | GRP | Activo | group | Global propuesta |  |
| 11120001 | 7 | Banco Pacifico | 2 | MOV | Activo | bank_account | Usuario propuesta |  |
| 11120002 | 8 | BanGuajala | 2 | MOV | Activo | bank_account | Usuario propuesta |  |
| 11120003 | 9 | Bolivariano 2019 | 2 | MOV | Activo | bank_account | Usuario propuesta |  |
| 11120004 | 10 | Bolivariano 2022 | 2 | MOV | Activo | bank_account | Usuario propuesta |  |
| 11120005 | 11 | JEP | 2 | MOV | Activo | bank_account | Usuario propuesta |  |
| 11120008 | 151 | Banco Pacifico 2023 | 2 | MOV | Activo | bank_account | Usuario propuesta |  |
| 11120009 | 156 | Bolivariano 2024 | 2 | MOV | Activo | bank_account | Usuario propuesta |  |
| 11120011 | 165 | Bolivariano 2025 | 2 | MOV | Activo | bank_account | Usuario propuesta |  |
| 11120012 | 170 | Banco Pichincha | 2 | MOV | Activo | bank_account | Usuario propuesta |  |
| 11120013 | 185 | Bolivariano 2026 | 2 | MOV | Activo | bank_account | Usuario propuesta |  |
| 11120014 | 189 | BMI Fondo de inversion y Seguro | 2 | MOV | Activo | bank_account | Usuario propuesta |  |
| 11130000 | 12 | Efectivo Corriente | 1 | GRP | Activo | group | Global propuesta |  |
| 11130001 | 13 | Billetera | 2 | MOV | Activo | cash_or_wallet | Usuario propuesta |  |
| 11130002 | 14 | Z - Billetera hasta 2019-07 | 2 | MOV | Activo | cash_or_wallet | Usuario propuesta | appears_archived_or_historical |
| 11130003 | 15 | z - Bolivariano | 2 | MOV | Activo | bank_account | Usuario propuesta | name_suggests_bank_but_parent_is_not_bank_group, appears_archived_or_historical |
| 11130004 | 155 | Vacaciones 2024 | 2 | MOV | Activo | cash_or_wallet | Usuario propuesta |  |
| 11130005 | 191 | Vacaciones 2026 | 2 | MOV | Activo | cash_or_wallet | Usuario propuesta |  |
| 11220000 | 16 | Inversiones | 1 | GRP | Activo | group | Global propuesta |  |
| 11220001 | 17 | Inversiones - Largo Plazo | 2 | MOV | Activo | investment | Usuario propuesta |  |
| 11220002 | 161 | Casa Mucho Lote | 2 | MOV | Activo | investment | Usuario propuesta |  |
| 11220003 | 182 | Inversiones DCA - Hapi | 2 | MOV | Activo | investment | Usuario propuesta |  |
| 11220004 | 183 | Operaciones de Alto Riesgo | 2 | MOV | Activo | investment | Usuario propuesta |  |
| 11320000 | 18 | Cuentas Personales por Cobrar | 1 | GRP | Activo | group | Global propuesta |  |
| 11320001 | 19 | Cuentas x Cobrar | 2 | MOV | Activo | receivable_or_personal_clearing | Usuario propuesta |  |
| 11320002 | 20 | Cuentas x Cobrar 2022 | 2 | MOV | Activo | receivable_or_personal_clearing | Usuario propuesta |  |
| 11320003 | 21 | Reneso 2019 | 2 | MOV | Activo | receivable_or_personal_clearing | Usuario propuesta |  |
| 11320004 | 22 | Maru | 2 | MOV | Activo | receivable_or_personal_clearing | Usuario propuesta |  |
| 11320005 | 23 | Jessica x Pagar | 2 | MOV | Activo | receivable_or_personal_clearing | Usuario propuesta | name_suggests_payable_but_parent_is_receivable_asset |
| 11320006 | 24 | z - Reneso | 2 | MOV | Activo | receivable_or_personal_clearing | Usuario propuesta | appears_archived_or_historical |
| 11320007 | 150 | Cuenta Carol | 2 | MOV | Activo | receivable_or_personal_clearing | Usuario propuesta |  |
| 11320008 | 152 | Cuenta Steve | 2 | MOV | Activo | receivable_or_personal_clearing | Usuario propuesta |  |
| 11320009 | 177 | Cuenta Daisy | 2 | MOV | Activo | receivable_or_personal_clearing | Usuario propuesta |  |
| 11320010 | 184 | Cuenta Tia Toya | 2 | MOV | Activo | receivable_or_personal_clearing | Usuario propuesta |  |
| 11320011 | 154 | Cuenta Lcorral | 2 | MOV | Activo | receivable_or_personal_clearing | Usuario propuesta |  |
| 11320012 | 146 | Cuenta Alekey | 2 | MOV | Activo | receivable_or_personal_clearing | Usuario propuesta |  |
| 11320013 | 141 | Cuenta Santi | 2 | MOV | Activo | receivable_or_personal_clearing | Usuario propuesta |  |
| 21100003 | 27 | Master Card - Jessica Lino | 2 | MOV | Pasivo | credit_card | Usuario propuesta | missing_legacy_group_parent, name_suggests_credit_card_but_parent_is_not_credit_card_group |
| 21200000 | 32 | Honorarios por Pagar | 1 | GRP | Pasivo | group | Global propuesta |  |
| 21200002 | 33 | Proveedores Trabajos | 2 | MOV | Pasivo | payable_or_loan | Usuario propuesta |  |
| 21200003 | 34 | Magozolutions | 2 | MOV | Pasivo | payable_or_loan | Usuario propuesta |  |
| 21300000 | 35 | Obligaciones Adquiridas | 1 | GRP | Pasivo | group | Global propuesta |  |
| 21300001 | 36 | Vivienda | 2 | MOV | Pasivo | payable_or_loan | Usuario propuesta |  |
| 21300002 | 37 | Ctas X Pagar 2019 | 2 | MOV | Pasivo | payable_or_loan | Usuario propuesta |  |
| 21300003 | 38 | Cuentas X Pagar 2022 | 2 | MOV | Pasivo | payable_or_loan | Usuario propuesta |  |
| 21300004 | 39 | Deudas Anteriores | 2 | MOV | Pasivo | payable_or_loan | Usuario propuesta | duplicate_or_reused_name |
| 21300005 | 40 | Milton Cobos | 2 | MOV | Pasivo | payable_or_loan | Usuario propuesta |  |
| 21300006 | 41 | z. Cuentas por Pagar | 2 | MOV | Pasivo | payable_or_loan | Usuario propuesta | appears_archived_or_historical |
| 21300007 | 143 | Pension Alimenticia - Vanessa | 2 | MOV | Pasivo | payable_or_loan | Usuario propuesta |  |
| 21300008 | 149 | Pensión 2023 | 2 | MOV | Pasivo | payable_or_loan | Usuario propuesta |  |
| 21300009 | 153 | Pensión 2024 | 2 | MOV | Pasivo | payable_or_loan | Usuario propuesta |  |
| 21300010 | 162 | Santi Estudios | 2 | MOV | Pasivo | payable_or_loan | Usuario propuesta |  |
| 21300011 | 163 | Proyecto UP - Santiago | 2 | MOV | Pasivo | payable_or_loan | Usuario propuesta |  |
| 21300012 | 166 | Pensión 2025 | 2 | MOV | Pasivo | payable_or_loan | Usuario propuesta |  |
| 21300013 | 169 | Prestamo Pichincha 2025 | 2 | MOV | Pasivo | bank_account | Usuario propuesta | name_suggests_bank_but_parent_is_not_bank_group |
| 21300014 | 31 | Pension 2022 | 2 | MOV | Pasivo | payable_or_loan | Usuario propuesta |  |
| 21300015 | 30 | z - Pension Alimenticia | 2 | MOV | Pasivo | payable_or_loan | Usuario propuesta | appears_archived_or_historical |
| 21300016 | 29 | Pension 2019 | 2 | MOV | Pasivo | payable_or_loan | Usuario propuesta |  |
| 21300017 | 188 | Pensión 2026 | 2 | MOV | Pasivo | payable_or_loan | Usuario propuesta |  |
| 21310000 | 173 | Creditos de Cpnsumo | 1 | GRP | Pasivo | group | Global propuesta |  |
| 21310001 | 26 | Visa Guayaquil - Carol | 2 | MOV | Pasivo | credit_card | Usuario propuesta |  |
| 21310002 | 28 | VISA JEP | 2 | MOV | Pasivo | credit_card | Usuario propuesta |  |
| 21310003 | 25 | VISA BGR | 2 | MOV | Pasivo | credit_card | Usuario propuesta |  |
| 21310004 | 159 | MasterCard BANKCARD | 2 | MOV | Pasivo | credit_card | Usuario propuesta |  |
| 21310005 | 164 | AMEX | 2 | MOV | Pasivo | credit_card | Usuario propuesta |  |
| 21310006 | 172 | MasterCard PRODUBANCO | 2 | MOV | Pasivo | credit_card | Usuario propuesta |  |
| 21310007 | 179 | VISA BANKCARD | 2 | MOV | Pasivo | credit_card | Usuario propuesta |  |
| 21400000 | 42 | Consumos por Pagar | 1 | GRP | Pasivo | group | Global propuesta |  |
| 21400001 | 43 | Otros Gastos | 2 | MOV | Pasivo | bridge_or_bypass | Usuario propuesta |  |
| 21400002 | 44 | Gastos con Facturas | 2 | MOV | Pasivo | bridge_or_bypass | Usuario propuesta |  |
| 21400003 | 45 | Gastos Varios 2018 | 2 | MOV | Pasivo | bridge_or_bypass | Usuario propuesta |  |
| 21400005 | 46 | Gastos Varios 2019 | 2 | MOV | Pasivo | bridge_or_bypass | Usuario propuesta |  |
| 21400006 | 47 | Gastos Varios 2022 | 2 | MOV | Pasivo | bridge_or_bypass | Usuario propuesta |  |
| 21400007 | 48 | Z - Netflix & Spotify 2018-2019 | 2 | MOV | Pasivo | bridge_or_bypass | Usuario propuesta | appears_archived_or_historical |
| 21400008 | 49 | Netflix & Spotify 2019-2020 | 2 | MOV | Pasivo | bridge_or_bypass | Usuario propuesta |  |
| 21400009 | 50 | Netflix & Spotify 2021-2022 | 2 | MOV | Pasivo | bridge_or_bypass | Usuario propuesta |  |
| 21400011 | 160 | Gastos Varios 2024 | 2 | MOV | Pasivo | bridge_or_bypass | Usuario propuesta |  |
| 21400012 | 167 | Gastos Varios 2025 | 2 | MOV | Pasivo | bridge_or_bypass | Usuario propuesta |  |
| 21400013 | 181 | Comidita A Credito | 2 | MOV | Pasivo | bridge_or_bypass | Usuario propuesta |  |
| 21400014 | 186 | Gastos Varios 2026 | 2 | MOV | Pasivo | bridge_or_bypass | Usuario propuesta |  |
| 21600000 | 51 | Impuestos por Pagar | 1 | GRP | Pasivo | group | Global propuesta |  |
| 21600001 | 52 | Impuestos IVA | 2 | MOV | Pasivo | uncategorized | Usuario propuesta |  |
| 22130000 | 53 | Prestamos | 1 | GRP | Pasivo | group | Global propuesta |  |
| 22130001 | 54 | Creditos | 2 | MOV | Pasivo | payable_or_loan | Usuario propuesta |  |
| 22130002 | 147 | Vacaciones 2023 | 2 | MOV | Pasivo | payable_or_loan | Usuario propuesta |  |
| 22130004 | 178 | Prestamo JEP | 2 | MOV | Pasivo | bank_account | Usuario propuesta | name_suggests_bank_but_parent_is_not_bank_group |
| 41000000 | 55 | Ingresos Activos | 1 | GRP | Ingresos | group | Global propuesta |  |
| 41000001 | 56 | Nómina, Sueldo, Salario | 2 | MOV | Ingresos | income_category | Global propuesta |  |
| 41000002 | 57 | Prestación social | 2 | MOV | Ingresos | income_category | Global propuesta |  |
| 41000003 | 58 | Trabajos Ocasionales | 2 | MOV | Ingresos | income_category | Global propuesta | duplicate_or_reused_name |
| 41000004 | 59 | Proveedores | 2 | MOV | Ingresos | income_category | Global propuesta | duplicate_or_reused_name |
| 41000005 | 60 | chilqueria | 2 | MOV | Ingresos | income_category | Revisar |  |
| 41000006 | 157 | Trabajos Realizados 2024 | 2 | MOV | Ingresos | income_category | Revisar | duplicate_or_reused_name |
| 41100000 | 61 | Ingresos Pasivos | 1 | GRP | Ingresos | group | Global propuesta |  |
| 41100002 | 62 | Rentas de Alquileres | 2 | MOV | Ingresos | income_category | Global propuesta | duplicate_or_reused_name |
| 41100003 | 63 | Rendimiento de Inversiones | 2 | MOV | Ingresos | investment | Usuario propuesta |  |
| 41100004 | 64 | Rentas de Alquileres | 2 | MOV | Ingresos | income_category | Global propuesta | duplicate_or_reused_name |
| 41100005 | 65 | Pension Alimenticia | 2 | MOV | Ingresos | income_category | Global propuesta | duplicate_or_reused_name |
| 41200000 | 66 | Otros Ingresos | 1 | GRP | Ingresos | group | Global propuesta |  |
| 41200001 | 67 | Trabajos Ocasionales | 2 | MOV | Ingresos | income_category | Global propuesta | duplicate_or_reused_name |
| 41200002 | 68 | Otros Ingresos | 2 | MOV | Ingresos | income_category | Global propuesta |  |
| 41200003 | 69 | Devolucion de Impuestos | 2 | MOV | Ingresos | income_category | Global propuesta | duplicate_or_reused_name |
| 41200004 | 70 | Subvenciones | 2 | MOV | Ingresos | income_category | Global propuesta |  |
| 41200005 | 71 | Devolucion de Impuestos | 2 | MOV | Ingresos | income_category | Global propuesta | duplicate_or_reused_name |
| 41200006 | 72 | Donativo o Regalo | 2 | MOV | Ingresos | income_category | Global propuesta |  |
| 61115000 | 73 | Vivienda | 1 | GRP | Gastos | group | Global propuesta |  |
| 61115001 | 74 | Alquiler Vivienda | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 61116002 | 75 | Servicio doméstico | 2 | MOV | Gastos | expense_category | Global propuesta | missing_legacy_group_parent |
| 61116003 | 76 | Lavanderia | 2 | MOV | Gastos | expense_category | Global propuesta | missing_legacy_group_parent |
| 61150000 | 77 | Salud y Estilo de Vida | 1 | GRP | Gastos | group | Global propuesta |  |
| 61150001 | 78 | Farmacia | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 61150003 | 79 | Dentista | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 61150004 | 80 | Veterinario Mascotas | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 61150005 | 81 | Belleza, peluquería, spa | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 61150006 | 82 | Clubs o Gimnasios | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 61150007 | 83 | Médicos, Clínicas | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 61150008 | 84 | Otros Gastos en Salud | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 61150009 | 85 | Óptica | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 61160000 | 86 | Cursos y Capacitaciones | 1 | GRP | Gastos | group | Global propuesta |  |
| 61160001 | 87 | Educación | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 61160002 | 88 | Material Escolar | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 61160003 | 89 | Libros, Revistas y Prensa | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 61160004 | 90 | Clases de Violin | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 61211000 | 91 | Servicios Basicos | 1 | GRP | Gastos | group | Global propuesta |  |
| 61211001 | 92 | Agua | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 61211002 | 93 | Energía | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 61213001 | 94 | Donativos | 2 | MOV | Gastos | expense_category | Global propuesta | missing_legacy_group_parent, duplicate_or_reused_name |
| 61213002 | 95 | Regalos | 2 | MOV | Gastos | expense_category | Global propuesta | missing_legacy_group_parent |
| 61240000 | 96 | Alimentacion | 1 | GRP | Gastos | group | Global propuesta |  |
| 61240001 | 97 | Supermercado, Alimentación | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 61240002 | 98 | Restaurantes y Bares | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 61240004 | 99 | Almuerzos, Desayunos Diarios | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 61260000 | 100 | Transporte y Vehiculos | 1 | GRP | Gastos | group | Global propuesta |  |
| 61260001 | 101 | Transporte | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 61260002 | 102 | Taxis | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 61260003 | 148 | Viajes Vacaciones | 2 | MOV | Gastos | expense_category | Revisar |  |
| 61270003 | 103 | Combustible | 2 | MOV | Gastos | expense_category | Global propuesta | missing_legacy_group_parent |
| 61280000 | 104 | Gastos del Hogar | 1 | GRP | Gastos | group | Global propuesta |  |
| 61280001 | 105 | Electrodomésticos, Electrónica e Informática | 2 | MOV | Gastos | expense_category | Global propuesta | duplicate_or_reused_name |
| 61280002 | 106 | Reformas y Reparaciones | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 61280003 | 107 | Menaje y Ferretería | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 61280004 | 108 | Mantenimiento y Reparaciones | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 61280005 | 109 | Electrodomésticos, Electrónica e Informática | 2 | MOV | Gastos | expense_category | Global propuesta | duplicate_or_reused_name |
| 61280006 | 110 | Ropa y complementos | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 62100000 | 111 | Gastos Financieros | 1 | GRP | Gastos | group | Global propuesta |  |
| 62130001 | 112 | Comisiones Bancarias | 2 | MOV | Gastos | expense_category | Global propuesta | missing_legacy_group_parent |
| 62130002 | 113 | Intereses Por Financiamiento | 2 | MOV | Gastos | expense_category | Global propuesta | missing_legacy_group_parent |
| 62130003 | 114 | Multas | 2 | MOV | Gastos | expense_category | Global propuesta | missing_legacy_group_parent |
| 63000000 | 115 | Impuestos y Aranceles | 1 | GRP | Gastos | group | Global propuesta |  |
| 63000001 | 116 | Impuestos | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 63000002 | 117 | Tramites Publicos | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 63000003 | 118 | Pension Alimenticia | 2 | MOV | Gastos | expense_category | Global propuesta | duplicate_or_reused_name |
| 63000004 | 171 | IESS Aportaciones | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 63000005 | 180 | Impuestos Consumo Exterior | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 63400000 | 119 | Otros Gastos | 1 | GRP | Gastos | group | Global propuesta |  |
| 63400001 | 120 | Donativos | 2 | MOV | Gastos | expense_category | Global propuesta | duplicate_or_reused_name |
| 63400002 | 121 | No se o no quiero saber | 2 | MOV | Gastos | expense_category | Global propuesta | duplicate_or_reused_name |
| 63400003 | 144 | Gastos Anteriores | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 63400004 | 190 | Primas de Seguros | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 64000000 | 122 | Diversiones y pasatiempos | 1 | GRP | Gastos | group | Global propuesta |  |
| 64000001 | 123 | Gastos varios en Ocio y diversión | 2 | MOV | Gastos | bridge_or_bypass | Usuario propuesta |  |
| 64000002 | 124 | Loterías y Apuestas | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 64000003 | 125 | Alojamiento en Hoteles | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 64000004 | 126 | Espectáculos, Cine, Teatro | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 64000005 | 127 | Diversiones Alcoholicas | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 64000006 | 128 | Tabaco | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 64000007 | 129 | Paseos con los pepes | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 64000008 | 142 | Fiestas y Eventos | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 64000009 | 175 | Juegos y Apps de Ocio para Consolas y Celulares | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 64000010 | 176 | Membresias Online para Ocio y Diversion | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 64100000 | 130 | Servicios Hogar | 1 | GRP | Gastos | group | Global propuesta |  |
| 64100001 | 131 | Teléfono e Internet | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 64100002 | 132 | Música y Apps | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 64100003 | 133 | Servicios online | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 64200000 | 134 | Servicios Profesionales | 1 | GRP | Gastos | group | Global propuesta |  |
| 64200001 | 135 | Asesores | 2 | MOV | Gastos | expense_category | Global propuesta |  |
| 64200002 | 136 | Préstamo Vehículo | 2 | MOV | Gastos | payable_or_loan | Usuario propuesta | expense_name_suggests_loan_payment_review_principal_vs_interest |
| 64200003 | 137 | Deudas Anteriores | 2 | MOV | Gastos | expense_category | Global propuesta | duplicate_or_reused_name |
| 64200004 | 138 | No se o no quiero saber | 2 | MOV | Gastos | expense_category | Global propuesta | duplicate_or_reused_name |
| 64200005 | 139 | Préstamo Personal | 2 | MOV | Gastos | payable_or_loan | Usuario propuesta | expense_name_suggests_loan_payment_review_principal_vs_interest |
| 64200006 | 140 | Proveedores | 2 | MOV | Gastos | expense_category | Global propuesta | duplicate_or_reused_name |
| 64200007 | 174 | Herramientas de Trabajo | 2 | MOV | Gastos | expense_category | Global propuesta |  |

## Pendiente de revisión manual

- Confirmar cuentas globales definitivas.
- Confirmar cuentas específicas del usuario para migración.
- Crear grupos faltantes o reubicar sus cuentas hijas.
- Corregir cuentas con nombre contradictorio frente a su cuenta madre.
- Revisar duplicados por nombre y decidir si son duplicados reales o conceptos distintos.
- Validar la codificación definitiva contra NIIF y contra las necesidades Hogar/PRO.
