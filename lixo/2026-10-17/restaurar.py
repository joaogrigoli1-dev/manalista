#!/usr/bin/env python3
"""Desfaz os movimentos registrados em movimentos.tsv desta pasta da lixeira.

O script é conservador por padrão: sem argumentos ele apenas simula (dry-run) e
imprime o que faria. Para efetivar, passe --apply.

Cada linha do movimentos.tsv descreve um arquivo que saiu da árvore do projeto
e foi parar dentro de lixo/<data>/, preservando o caminho original relativo à
raiz do repositório. Restaurar = mover de volta para o caminho de origem.

Antes de mover qualquer coisa de volta, o script valida:

  1. que o arquivo ainda existe no destino (dentro da lixeira);
  2. que o SHA-256 do conteúdo bate com um dos dois hashes registrados no TSV:
     `sha256` (o conteúdo no instante do movimento) ou `sha256_atual` (o
     conteúdo depois das correções de referência feitas na mesma limpeza). Se
     não bate com nenhum dos dois, o arquivo foi editado ou corrompido depois
     da limpeza e o script recusa a linha;
  3. que o caminho de origem está livre — se já existe um arquivo lá, o script
     recusa aquela linha em vez de sobrescrever trabalho novo.

Qualquer linha que falhe a validação é recusada individualmente e reportada no
fim; as outras continuam. Nada é apagado: restaurar move o arquivo de volta.

Uso:
    python3 lixo/2026-10-17/restaurar.py              # simula
    python3 lixo/2026-10-17/restaurar.py --apply      # executa
    python3 lixo/2026-10-17/restaurar.py --apply --only "AGENTS.md"
    python3 lixo/2026-10-17/restaurar.py --apply --tipo lixo    # só a lixeira
    python3 lixo/2026-10-17/restaurar.py --apply --force   # sobrescreve origem ocupada

Observação sobre git: arquivos que estavam versionados aparecem como deleção no
commit de limpeza. Restaurar o arquivo no disco resolve o conteúdo, mas o índice
do git continua refletindo a deleção até você rodar `git add <caminho>`.
"""

from __future__ import annotations

import argparse
import hashlib
import shutil
import sys
from pathlib import Path

# A pasta deste script é lixo/<data>/; a raiz do repositório está dois níveis acima.
LIXEIRA = Path(__file__).resolve().parent
RAIZ = LIXEIRA.parent.parent
TSV = LIXEIRA / "movimentos.tsv"


def sha256(caminho: Path) -> str:
    h = hashlib.sha256()
    with caminho.open("rb") as fh:
        for bloco in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(bloco)
    return h.hexdigest()


def ler_movimentos() -> list[dict[str, str]]:
    if not TSV.exists():
        sys.exit(f"ERRO: não encontrei {TSV}")

    movimentos: list[dict[str, str]] = []
    with TSV.open(encoding="utf-8") as fh:
        for numero, linha in enumerate(fh, start=1):
            linha = linha.rstrip("\n")
            if not linha or linha.startswith("#"):
                continue
            campos = linha.split("\t")
            if numero == 1 and campos[0].strip().lower() == "origem":
                continue  # cabeçalho
            if len(campos) < 3:
                print(f"AVISO: linha {numero} malformada, ignorada: {linha!r}")
                continue
            movimentos.append(
                {
                    "linha": str(numero),
                    "origem": campos[0],
                    "destino": campos[1],
                    "sha256": campos[2],
                    "tipo": campos[3] if len(campos) > 3 else "",
                    "git": campos[4] if len(campos) > 4 else "",
                    # sha256_atual só existe para os arquivos cujo conteúdo mudou
                    # depois do movimento (correção de caminhos nos documentos).
                    "sha256_atual": campos[5] if len(campos) > 5 else "",
                }
            )
    return movimentos


def main() -> int:
    parser = argparse.ArgumentParser(description="Restaura arquivos movidos para a lixeira.")
    parser.add_argument("--apply", action="store_true", help="executa de verdade (sem isso, só simula)")
    parser.add_argument("--only", metavar="SUBSTRING", help="restaura só os caminhos que contenham esta substring")
    parser.add_argument("--tipo", choices=["lixo", "organizacao"], help="restaura só os movimentos deste tipo")
    parser.add_argument("--force", action="store_true", help="sobrescreve o caminho de origem se já estiver ocupado")
    args = parser.parse_args()

    movimentos = ler_movimentos()
    if args.only:
        movimentos = [m for m in movimentos if args.only in m["origem"] or args.only in m["destino"]]
    if args.tipo:
        movimentos = [m for m in movimentos if m["tipo"] == args.tipo]

    if not movimentos:
        print("Nada a restaurar.")
        return 0

    restaurados: list[str] = []
    recusados: list[tuple[str, str]] = []

    for mov in movimentos:
        origem = RAIZ / mov["origem"]
        destino = RAIZ / mov["destino"]

        if not destino.exists():
            recusados.append((mov["origem"], f"não existe na lixeira: {mov['destino']}"))
            continue

        atual = sha256(destino)
        aceitos = {h for h in (mov["sha256"], mov["sha256_atual"]) if h}
        if atual not in aceitos:
            esperados = " ou ".join(sorted(h[:12] + "…" for h in aceitos))
            recusados.append(
                (mov["origem"], f"SHA-256 divergente (esperava {esperados}, achei {atual[:12]}…)")
            )
            continue

        if origem.exists() and not args.force:
            recusados.append((mov["origem"], "caminho de origem já ocupado (use --force para sobrescrever)"))
            continue

        if not args.apply:
            print(f"[simulação] {mov['destino']}  ->  {mov['origem']}")
            restaurados.append(mov["origem"])
            continue

        origem.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(destino), str(origem))
        print(f"restaurado: {mov['destino']}  ->  {mov['origem']}")
        restaurados.append(mov["origem"])

    print()
    modo = "restaurados" if args.apply else "restauráveis (simulação)"
    print(f"{len(restaurados)} {modo}, {len(recusados)} recusados")
    for caminho, motivo in recusados:
        print(f"  RECUSADO  {caminho}: {motivo}")

    if not args.apply and restaurados:
        print("\nNada foi movido. Rode de novo com --apply para efetivar.")

    return 1 if recusados else 0


if __name__ == "__main__":
    sys.exit(main())
