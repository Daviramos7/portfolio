# -*- coding: utf-8 -*-
"""
Auditoria de Despesas Públicas — Recife 2023
Pipeline completo para Google Colab ou execução local.

O script:
- instala o PySpark automaticamente caso ele não esteja disponível;
- baixa e valida o CSV oficial;
- impede que uma página HTML seja processada como CSV;
- normaliza e valida as colunas;
- limpa valores monetários brasileiros;
- processa os dados com PySpark;
- calcula métricas financeiras e de qualidade;
- gera ranking dos órgãos;
- cria um dashboard 16:9 corrigido para o portfólio;
- exporta CSV, JSON, PNG e um ZIP com todos os resultados.
"""

from __future__ import annotations

import csv
import importlib
import json
import os
import re
import shutil
import subprocess
import sys
import time
import unicodedata
from pathlib import Path
from typing import Optional


# ============================================================
# 0. DEPENDÊNCIAS
# ============================================================

def garantir_dependencia(modulo: str, pacote: Optional[str] = None) -> None:
    """Instala silenciosamente um pacote ausente e atualiza o cache de imports."""
    try:
        importlib.import_module(modulo)
    except ImportError:
        nome_pacote = pacote or modulo
        print(f"📦 Instalando dependência ausente: {nome_pacote}...")
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", "-q", nome_pacote]
        )
        importlib.invalidate_caches()


garantir_dependencia("pyspark", "pyspark>=3.5,<4.1")
garantir_dependencia("requests")
garantir_dependencia("pandas")
garantir_dependencia("matplotlib")

import matplotlib.pyplot as plt
import pandas as pd
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from pyspark import StorageLevel
from pyspark.sql import DataFrame, SparkSession
from pyspark.sql.functions import (
    col,
    desc,
    lit,
    regexp_replace,
    sum as spark_sum,
    trim,
    when,
)
from pyspark.sql.types import DoubleType


# ============================================================
# 1. CONFIGURAÇÕES
# ============================================================

DATASET_URLS = [
    (
        "https://dados.recife.pe.gov.br/dataset/"
        "63f7941b-9a1e-4a49-893b-d5f16e2134d8/resource/"
        "ba29bffc-6478-4dd7-80a4-4c3ab6157f59/download/"
        "despesas-orcamentarias-2023.csv"
    ),
    (
        "http://dados.recife.pe.gov.br/dataset/"
        "63f7941b-9a1e-4a49-893b-d5f16e2134d8/resource/"
        "ba29bffc-6478-4dd7-80a4-4c3ab6157f59/download/"
        "despesas-orcamentarias-2023.csv"
    ),
]

# Se o portal recusar a conexão do Colab, o notebook abrirá automaticamente
# uma janela para você enviar o CSV baixado manualmente.
PERMITIR_UPLOAD_MANUAL = True

ARQUIVO_LOCAL = Path("/content/despesas_orcamentarias_recife_2023.csv")
PASTA_SAIDA = Path("/content/saida_auditoria_recife_2023")

# Em execução local fora do Colab, usa a pasta atual.
if not Path("/content").exists():
    ARQUIVO_LOCAL = Path("despesas_orcamentarias_recife_2023.csv")
    PASTA_SAIDA = Path("saida_auditoria_recife_2023")

FORCAR_DOWNLOAD = False
TOP_N_ANALISE = 10
TOP_N_DASHBOARD = 7
EXPORTAR_PARQUET = False
MOSTRAR_DASHBOARD_NO_NOTEBOOK = True

COLUNAS_OBRIGATORIAS = {
    "orgao_nome",
    "valor_liquidado",
}

COLUNAS_MONETARIAS_CANDIDATAS = [
    "valor_empenhado",
    "valor_liquidado",
    "valor_pago",
]


# ============================================================
# 2. FUNÇÕES UTILITÁRIAS
# ============================================================

def formatar_inteiro_br(valor: int) -> str:
    return f"{int(valor):,}".replace(",", ".")


def formatar_moeda_br(valor: float) -> str:
    texto = f"{float(valor):,.2f}"
    return "R$ " + texto.replace(",", "X").replace(".", ",").replace("X", ".")


def normalizar_nome_coluna(nome: str) -> str:
    nome = unicodedata.normalize("NFKD", str(nome))
    nome = nome.encode("ascii", "ignore").decode("ascii")
    nome = nome.strip().lower()
    nome = re.sub(r"[^a-z0-9]+", "_", nome)
    return nome.strip("_")


def arquivo_parece_html(caminho: Path) -> bool:
    if not caminho.exists() or caminho.stat().st_size == 0:
        return True

    with caminho.open("rb") as arquivo:
        inicio = arquivo.read(4096).lstrip().lower()

    marcadores_html = (
        b"<!doctype html",
        b"<html",
        b"<head",
        b"<body",
    )
    return inicio.startswith(marcadores_html)


def validar_csv_local(caminho: Path) -> bool:
    if not caminho.exists():
        return False

    if caminho.stat().st_size < 1024 or arquivo_parece_html(caminho):
        return False

    try:
        with caminho.open("r", encoding="utf-8-sig", errors="ignore") as arquivo:
            primeira_linha = arquivo.readline()

        quantidade_separadores = max(
            primeira_linha.count(";"),
            primeira_linha.count(","),
            primeira_linha.count("\t"),
        )
        return quantidade_separadores >= 2
    except OSError:
        return False


def criar_sessao_http() -> requests.Session:
    retry = Retry(
        total=4,
        connect=4,
        read=4,
        backoff_factor=1.5,
        status_forcelist=(408, 429, 500, 502, 503, 504),
        allowed_methods=frozenset({"GET"}),
    )

    adaptador = HTTPAdapter(max_retries=retry)
    sessao = requests.Session()
    sessao.mount("http://", adaptador)
    sessao.mount("https://", adaptador)
    sessao.headers.update(
        {
            "User-Agent": (
                "Mozilla/5.0 (compatible; RecifePublicAudit/1.0; "
                "+https://dados.recife.pe.gov.br/)"
            )
        }
    )
    return sessao


def esta_no_colab() -> bool:
    try:
        import google.colab  # type: ignore
        return True
    except ImportError:
        return False


def solicitar_upload_manual(destino: Path) -> None:
    """
    Fallback para o Google Colab quando o Portal de Dados Abertos recusa
    a conexão ou fica temporariamente fora do ar.
    """
    if not esta_no_colab():
        raise RuntimeError(
            "O download automático falhou e o script não está no Google Colab. "
            f"Baixe o CSV manualmente e salve-o como: {destino.resolve()}"
        )

    print("\n" + "=" * 72)
    print("⚠️  DOWNLOAD AUTOMÁTICO INDISPONÍVEL")
    print("=" * 72)
    print(
        "O servidor do Portal de Dados Abertos recusou a conexão do Colab.\n"
        "Baixe o recurso pelo navegador e, quando a janela abaixo abrir,\n"
        "selecione o arquivo CSV de despesas orçamentárias de 2023."
    )
    print("=" * 72)

    from google.colab import files  # type: ignore

    enviados = files.upload()
    if not enviados:
        raise RuntimeError("Nenhum arquivo foi enviado.")

    candidatos = [
        (nome, conteudo)
        for nome, conteudo in enviados.items()
        if nome.lower().endswith((".csv", ".txt"))
    ]

    if not candidatos:
        nomes = ", ".join(enviados.keys())
        raise RuntimeError(
            "Nenhum CSV foi encontrado entre os arquivos enviados. "
            f"Arquivos recebidos: {nomes}"
        )

    # Usa o maior CSV, caso o usuário tenha selecionado mais de um arquivo.
    nome_escolhido, conteudo = max(candidatos, key=lambda item: len(item[1]))

    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_bytes(conteudo)

    if not validar_csv_local(destino):
        destino.unlink(missing_ok=True)
        raise RuntimeError(
            f"O arquivo enviado ({nome_escolhido}) não parece ser um CSV válido."
        )

    print(
        f"✅ Upload concluído: {nome_escolhido} -> {destino} "
        f"({destino.stat().st_size / (1024 * 1024):.2f} MB)"
    )


def tentar_download_url(url: str, destino: Path) -> None:
    temporario = destino.with_suffix(destino.suffix + ".part")
    temporario.unlink(missing_ok=True)

    sessao = criar_sessao_http()

    try:
        with sessao.get(
            url,
            stream=True,
            timeout=(20, 240),
            allow_redirects=True,
        ) as resposta:
            print(f"   Tentativa: {url}")
            print(f"   HTTP: {resposta.status_code}")
            print(f"   URL final: {resposta.url}")
            print(
                "   Content-Type: "
                f"{resposta.headers.get('content-type', 'desconhecido')}"
            )

            resposta.raise_for_status()

            content_type = resposta.headers.get("content-type", "").lower()
            iterador = resposta.iter_content(chunk_size=1024 * 1024)

            try:
                primeiro_bloco = next(iterador)
            except StopIteration as exc:
                raise RuntimeError("O servidor retornou um arquivo vazio.") from exc

            inicio = primeiro_bloco.lstrip().lower()
            if (
                "text/html" in content_type
                or inicio.startswith(b"<!doctype html")
                or inicio.startswith(b"<html")
            ):
                previa = primeiro_bloco[:300].decode("utf-8", errors="ignore")
                raise RuntimeError(
                    "A URL retornou HTML em vez do CSV esperado.\n"
                    f"Prévia da resposta:\n{previa}"
                )

            baixados = 0
            with temporario.open("wb") as arquivo:
                arquivo.write(primeiro_bloco)
                baixados += len(primeiro_bloco)

                for bloco in iterador:
                    if not bloco:
                        continue

                    arquivo.write(bloco)
                    baixados += len(bloco)

                    if baixados % (10 * 1024 * 1024) < len(bloco):
                        print(
                            f"   {baixados / (1024 * 1024):.1f} MB baixados..."
                        )

        temporario.replace(destino)

        if not validar_csv_local(destino):
            destino.unlink(missing_ok=True)
            raise RuntimeError(
                "O download terminou, mas o arquivo não passou na validação de CSV."
            )

    finally:
        sessao.close()
        temporario.unlink(missing_ok=True)


def baixar_dataset(
    urls: list[str],
    destino: Path,
    forcar: bool = False,
) -> None:
    if destino.exists() and not forcar and validar_csv_local(destino):
        tamanho_mb = destino.stat().st_size / (1024 * 1024)
        print(
            f"✅ Dataset local válido encontrado: "
            f"{destino} ({tamanho_mb:.2f} MB)"
        )
        return

    if destino.exists():
        print("🧹 Removendo arquivo local inválido ou desatualizado...")
        destino.unlink()

    destino.parent.mkdir(parents=True, exist_ok=True)
    erros: list[str] = []

    print("📥 Baixando dataset oficial...")

    for url in urls:
        try:
            tentar_download_url(url, destino)
            print(
                f"✅ Dataset salvo em {destino} "
                f"({destino.stat().st_size / (1024 * 1024):.2f} MB)"
            )
            return
        except Exception as erro:
            destino.unlink(missing_ok=True)
            mensagem = f"{type(erro).__name__}: {erro}"
            erros.append(f"{url}\n{mensagem}")
            print(f"⚠️  Falha nesta URL: {mensagem}")

    if PERMITIR_UPLOAD_MANUAL:
        solicitar_upload_manual(destino)
        return

    raise RuntimeError(
        "Não foi possível baixar o dataset por nenhuma URL.\n\n"
        + "\n\n".join(erros)
    )

def detectar_separador(caminho: Path) -> str:
    with caminho.open("r", encoding="utf-8-sig", errors="ignore") as arquivo:
        amostra = arquivo.read(16384)

    try:
        dialect = csv.Sniffer().sniff(amostra, delimiters=";,\t")
        return dialect.delimiter
    except csv.Error:
        primeira_linha = amostra.splitlines()[0] if amostra else ""
        contagens = {
            ";": primeira_linha.count(";"),
            ",": primeira_linha.count(","),
            "\t": primeira_linha.count("\t"),
        }
        return max(contagens, key=contagens.get)


def normalizar_colunas_spark(df: DataFrame) -> DataFrame:
    nomes_usados: set[str] = set()

    for coluna_original in df.columns:
        base = normalizar_nome_coluna(coluna_original) or "coluna"
        novo_nome = base
        contador = 2

        while novo_nome in nomes_usados:
            novo_nome = f"{base}_{contador}"
            contador += 1

        nomes_usados.add(novo_nome)

        if coluna_original != novo_nome:
            df = df.withColumnRenamed(coluna_original, novo_nome)

    return df


def expressao_moeda_brasileira(nome_coluna: str):
    """
    Converte:
    - 1.234,56 -> 1234.56
    - 1234,56  -> 1234.56
    - 1234.56  -> 1234.56
    - R$ 1.234,56 -> 1234.56
    """
    valor = trim(col(nome_coluna).cast("string"))
    valor = regexp_replace(valor, r"[\s\u00A0]", "")
    valor = regexp_replace(valor, r"[^0-9,.\-]", "")

    valor_com_virgula = regexp_replace(
        regexp_replace(valor, r"\.", ""),
        ",",
        ".",
    )

    return (
        when(valor.isNull() | (valor == ""), lit(None).cast(DoubleType()))
        .when(valor.contains(","), valor_com_virgula.cast(DoubleType()))
        .otherwise(valor.cast(DoubleType()))
    )


def preparar_dataframe(df: DataFrame) -> DataFrame:
    df = normalizar_colunas_spark(df)

    faltantes = sorted(COLUNAS_OBRIGATORIAS - set(df.columns))
    if faltantes:
        raise ValueError(
            "O dataset não possui as colunas obrigatórias após normalização.\n"
            f"Faltando: {faltantes}\n"
            f"Disponíveis: {df.columns}"
        )

    for coluna_monetaria in COLUNAS_MONETARIAS_CANDIDATAS:
        if coluna_monetaria in df.columns:
            df = df.withColumn(
                f"{coluna_monetaria}_limpo",
                expressao_moeda_brasileira(coluna_monetaria),
            )

    return df


def abreviar_rotulo_orgao(nome: object, largura: int = 38) -> str:
    texto = re.sub(r"\s+", " ", str(nome or "Órgão não informado")).strip()
    texto = texto.title()

    for conectivo in (" De ", " Da ", " Do ", " Das ", " Dos ", " E "):
        texto = texto.replace(conectivo, conectivo.lower())

    import textwrap

    return textwrap.fill(
        texto,
        width=largura,
        break_long_words=False,
        break_on_hyphens=False,
    )


def criar_dashboard_portfolio(
    pdf_top_orgaos: pd.DataFrame,
    linhas_processadas: int,
    total_liquidado: float,
    percentual_pago: float,
    caminho_saida: Path,
) -> None:
    if pdf_top_orgaos.empty:
        raise ValueError("Não há dados agregados suficientes para gerar o portfolio.")

    plot_df = (
        pdf_top_orgaos.head(TOP_N_DASHBOARD)
        .copy()
        .sort_values("total_liquidado", ascending=True)
        .reset_index(drop=True)
    )

    plot_df["valor_bilhoes"] = plot_df["total_liquidado"] / 1_000_000_000
    plot_df["rotulo_orgao"] = plot_df["orgao_nome"].apply(abreviar_rotulo_orgao)

    fig = plt.figure(figsize=(16, 9))

    grade = fig.add_gridspec(
        nrows=2,
        ncols=1,
        height_ratios=[1.30, 4.55],
        hspace=0.28,
    )

    # ========================================================
    # TÍTULO PRINCIPAL
    # ========================================================

    fig.suptitle(
        "Auditoria de Despesas Públicas — Recife 2023",
        fontsize=27,
        fontweight="bold",
        y=0.965,
    )

    # ========================================================
    # INDICADORES SUPERIORES
    # ========================================================

    ax_metricas = fig.add_subplot(grade[0])
    ax_metricas.axis("off")

    metricas = [
        (
            formatar_inteiro_br(linhas_processadas),
            "registros processados",
            26,
        ),
        (
            formatar_moeda_br(total_liquidado),
            "valor liquidado",
            20,
        ),
        (
            f"{percentual_pago:.2f}%",
            "pago sobre liquidado",
            25,
        ),
    ]

    # Cada indicador ocupa uma faixa própria da largura do gráfico.
    posicoes_x = [0.16, 0.50, 0.84]

    for posicao_x, (valor, rotulo, tamanho_valor) in zip(
        posicoes_x,
        metricas,
    ):
        ax_metricas.text(
            posicao_x,
            0.64,
            valor,
            transform=ax_metricas.transAxes,
            fontsize=tamanho_valor,
            fontweight="bold",
            ha="center",
            va="center",
        )

        ax_metricas.text(
            posicao_x,
            0.25,
            rotulo,
            transform=ax_metricas.transAxes,
            fontsize=13,
            ha="center",
            va="center",
        )

    # Linhas divisórias discretas entre os indicadores.
    for posicao_divisoria in (0.33, 0.67):
        ax_metricas.plot(
            [posicao_divisoria, posicao_divisoria],
            [0.18, 0.78],
            transform=ax_metricas.transAxes,
            linewidth=0.8,
            alpha=0.20,
        )

    # ========================================================
    # GRÁFICO PRINCIPAL
    # ========================================================

    ax = fig.add_subplot(grade[1])

    barras = ax.barh(
        plot_df["rotulo_orgao"],
        plot_df["valor_bilhoes"],
    )

    maior_valor = float(plot_df["valor_bilhoes"].max())
    folga = maior_valor * 0.22 if maior_valor > 0 else 1

    ax.set_xlim(0, maior_valor + folga)

    rotulos_valor = [
        f"R$ {valor:.2f} bi".replace(".", ",")
        for valor in plot_df["valor_bilhoes"]
    ]

    ax.bar_label(
        barras,
        labels=rotulos_valor,
        padding=6,
        fontsize=10,
    )

    ax.set_title(
        "Maiores órgãos por valor liquidado",
        fontsize=20,
        pad=14,
    )

    ax.set_xlabel(
        "Valor liquidado (R$ bilhões)",
        fontsize=12,
    )

    ax.tick_params(
        axis="y",
        labelsize=10,
        pad=8,
    )

    ax.tick_params(
        axis="x",
        labelsize=10,
    )

    ax.grid(
        axis="x",
        linestyle="--",
        alpha=0.25,
    )

    # ========================================================
    # RODAPÉ E EXPORTAÇÃO
    # ========================================================

    fig.text(
        0.29,
        0.035,
        "Fonte: Portal de Dados Abertos da Prefeitura do Recife | Pipeline PySpark",
        fontsize=10,
        ha="left",
    )

    fig.subplots_adjust(
        left=0.29,
        right=0.96,
        top=0.90,
        bottom=0.10,
    )

    caminho_saida.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    # 16 x 9 com 100 DPI = 1600 x 900.
    fig.savefig(
        caminho_saida,
        dpi=100,
    )

    plt.show()
    plt.close(fig)

def exibir_imagem_no_notebook(caminho: Path) -> None:
    if not MOSTRAR_DASHBOARD_NO_NOTEBOOK:
        return

    try:
        from IPython.display import Image, display

        display(Image(filename=str(caminho)))
    except Exception:
        pass


def criar_zip_resultados(pasta: Path) -> Path:
    caminho_base = pasta.parent / pasta.name
    return Path(
        shutil.make_archive(
            str(caminho_base),
            "zip",
            root_dir=str(pasta),
        )
    )


# ============================================================
# 3. PIPELINE PRINCIPAL
# ============================================================

def executar_pipeline() -> None:
    spark: Optional[SparkSession] = None
    df_clean: Optional[DataFrame] = None
    inicio_total = time.perf_counter()

    PASTA_SAIDA.mkdir(parents=True, exist_ok=True)

    try:
        baixar_dataset(
            DATASET_URLS,
            ARQUIVO_LOCAL,
            forcar=FORCAR_DOWNLOAD,
        )

        separador = detectar_separador(ARQUIVO_LOCAL)
        print(f"🔎 Separador detectado: {repr(separador)}")

        try:
            sessao_ativa = SparkSession.getActiveSession()
            if sessao_ativa is not None:
                sessao_ativa.stop()
        except Exception:
            pass

        print("⚡ Iniciando motor de processamento distribuído...")

        spark = (
            SparkSession.builder
            .master("local[*]")
            .appName("Recife_Public_Audit_2023")
            .config("spark.driver.memory", "2g")
            .config("spark.sql.adaptive.enabled", "true")
            .config("spark.sql.adaptive.coalescePartitions.enabled", "true")
            .config("spark.sql.shuffle.partitions", "8")
            .config("spark.ui.showConsoleProgress", "false")
            .getOrCreate()
        )

        spark.sparkContext.setLogLevel("WARN")

        print(f"   Spark: {spark.version}")
        print(f"   Paralelismo padrão: {spark.sparkContext.defaultParallelism}")

        inicio_processamento = time.perf_counter()

        print("📖 Lendo CSV com Spark...")
        df_raw = (
            spark.read
            .option("header", "true")
            .option("sep", separador)
            .option("encoding", "UTF-8")
            .option("quote", '"')
            .option("escape", '"')
            .option("multiLine", "false")
            .option("mode", "PERMISSIVE")
            .csv(str(ARQUIVO_LOCAL))
        )

        df_clean = preparar_dataframe(df_raw)
        df_clean.persist(StorageLevel.MEMORY_AND_DISK)

        linhas_processadas = df_clean.count()

        print(f"✅ {formatar_inteiro_br(linhas_processadas)} registros carregados.")
        print(f"✅ {len(df_clean.columns)} colunas disponíveis.")

        coluna_liquidado = "valor_liquidado_limpo"
        coluna_pago = (
            "valor_pago_limpo"
            if "valor_pago_limpo" in df_clean.columns
            else None
        )
        coluna_empenhado = (
            "valor_empenhado_limpo"
            if "valor_empenhado_limpo" in df_clean.columns
            else None
        )

        agregacoes = [
            spark_sum(coluna_liquidado).alias("total_liquidado"),
            spark_sum(
                when(col("orgao_nome").isNull() | (trim(col("orgao_nome")) == ""), 1)
                .otherwise(0)
            ).alias("orgaos_ausentes"),
            spark_sum(
                when(col(coluna_liquidado).isNull(), 1).otherwise(0)
            ).alias("valores_liquidados_invalidos"),
        ]

        if coluna_pago:
            agregacoes.append(
                spark_sum(coluna_pago).alias("total_pago")
            )

        if coluna_empenhado:
            agregacoes.append(
                spark_sum(coluna_empenhado).alias("total_empenhado")
            )

        metricas = df_clean.agg(*agregacoes).first().asDict()

        total_liquidado = float(metricas.get("total_liquidado") or 0.0)
        total_pago = float(metricas.get("total_pago") or 0.0)
        total_empenhado = float(metricas.get("total_empenhado") or 0.0)

        percentual_pago = (
            (total_pago / total_liquidado) * 100
            if total_liquidado > 0 and coluna_pago
            else 0.0
        )

        print("📊 Calculando ranking dos órgãos...")

        top_orgaos_spark = (
            df_clean
            .filter(
                col("orgao_nome").isNotNull()
                & (trim(col("orgao_nome")) != "")
                & col(coluna_liquidado).isNotNull()
            )
            .groupBy("orgao_nome")
            .agg(
                spark_sum(coluna_liquidado).alias("total_liquidado")
            )
            .orderBy(desc("total_liquidado"))
            .limit(TOP_N_ANALISE)
        )

        pdf_top_orgaos = top_orgaos_spark.toPandas()
        tempo_processamento = time.perf_counter() - inicio_processamento

        print("\n" + "=" * 72)
        print("🏛️  RELATÓRIO DE AUDITORIA FINANCEIRA — RECIFE 2023")
        print("=" * 72)
        print(f"📂 Registros processados: {formatar_inteiro_br(linhas_processadas)}")
        if coluna_empenhado:
            print(f"🧾 Valor empenhado:      {formatar_moeda_br(total_empenhado)}")
        print(f"💰 Valor liquidado:      {formatar_moeda_br(total_liquidado)}")
        if coluna_pago:
            print(f"✅ Valor pago:            {formatar_moeda_br(total_pago)}")
            print(f"📈 Pago/liquidado:        {percentual_pago:.2f}%")
        print("-" * 72)
        print("🏆 TOP 5 ÓRGÃOS POR VALOR LIQUIDADO:")

        for posicao, linha in enumerate(
            pdf_top_orgaos.head(5).itertuples(index=False),
            start=1,
        ):
            nome = re.sub(r"\s+", " ", str(linha.orgao_nome)).strip()
            print(
                f"   {posicao}. {nome[:55]}: "
                f"{formatar_moeda_br(linha.total_liquidado)}"
            )

        print("\n" + "=" * 72)
        print("🚀 MÉTRICAS DO PIPELINE")
        print("=" * 72)
        print(f"⏱️  Processamento Spark: {tempo_processamento:.4f} segundos")
        print(
            f"💾 Arquivo de entrada:   "
            f"{ARQUIVO_LOCAL.stat().st_size / (1024 * 1024):.2f} MB"
        )
        print(f"🧩 Partições do DataFrame: {df_clean.rdd.getNumPartitions()}")
        print(
            f"⚠️  Órgãos ausentes:     "
            f"{formatar_inteiro_br(metricas.get('orgaos_ausentes') or 0)}"
        )
        print(
            f"⚠️  Valores inválidos:   "
            f"{formatar_inteiro_br(metricas.get('valores_liquidados_invalidos') or 0)}"
        )
        print("=" * 72)

        caminho_top10 = PASTA_SAIDA / "top_10_orgaos_por_valor_liquidado.csv"
        pdf_top_orgaos.to_csv(
            caminho_top10,
            index=False,
            encoding="utf-8-sig",
        )

        resumo = {
            "projeto": "Auditoria de Despesas Públicas — Recife 2023",
            "fontes_tentadas": DATASET_URLS,
            "registros_processados": int(linhas_processadas),
            "valor_empenhado": total_empenhado if coluna_empenhado else None,
            "valor_liquidado": total_liquidado,
            "valor_pago": total_pago if coluna_pago else None,
            "percentual_pago_sobre_liquidado": (
                percentual_pago if coluna_pago else None
            ),
            "tempo_processamento_spark_segundos": round(
                tempo_processamento,
                4,
            ),
            "tamanho_arquivo_mb": round(
                ARQUIVO_LOCAL.stat().st_size / (1024 * 1024),
                2,
            ),
            "particoes_dataframe": int(df_clean.rdd.getNumPartitions()),
            "orgaos_ausentes": int(metricas.get("orgaos_ausentes") or 0),
            "valores_liquidados_invalidos": int(
                metricas.get("valores_liquidados_invalidos") or 0
            ),
            "spark_version": spark.version,
        }

        caminho_resumo = PASTA_SAIDA / "resumo_execucao.json"
        caminho_resumo.write_text(
            json.dumps(resumo, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

        if EXPORTAR_PARQUET:
            caminho_parquet = PASTA_SAIDA / "dados_limpos_parquet"
            (
                df_clean
                .write
                .mode("overwrite")
                .parquet(str(caminho_parquet))
            )

        caminho_dashboard = PASTA_SAIDA / "04_dashboard_portfolio.png"
        print("🖼️  Gerando portfolio...")

        criar_dashboard_portfolio(
            pdf_top_orgaos=pdf_top_orgaos,
            linhas_processadas=linhas_processadas,
            total_liquidado=total_liquidado,
            percentual_pago=percentual_pago,
            caminho_saida=caminho_dashboard,
        )

        exibir_imagem_no_notebook(caminho_dashboard)

        caminho_zip = criar_zip_resultados(PASTA_SAIDA)

        tempo_total = time.perf_counter() - inicio_total

        print("\n✅ PIPELINE CONCLUÍDO")
        print(f"🖼️ Dashboard: {caminho_dashboard}")
        print(f"📄 Ranking:   {caminho_top10}")
        print(f"📋 Resumo:    {caminho_resumo}")
        print(f"📦 ZIP:       {caminho_zip}")
        print(f"⏱️ Tempo total: {tempo_total:.2f} segundos")

    except Exception as erro:
        print("\n❌ O pipeline foi interrompido.")
        print(f"Tipo: {type(erro).__name__}")
        print(f"Detalhes: {erro}")
        raise

    finally:
        if df_clean is not None:
            try:
                df_clean.unpersist()
            except Exception:
                pass

        if spark is not None:
            try:
                spark.stop()
                print("🛑 Sessão Spark encerrada.")
            except Exception:
                pass


if __name__ == "__main__":
    executar_pipeline()
