# M16 · Fase 3 — lista de downloads (rota aprovada) — **NÃO BAIXADO**

Status: **aguardando o ok do Davi.** Nada foi baixado nem instalado. Levantado em 23/10/2026 por API pública
(Hugging Face, GitHub, PyPI, download.pytorch.org). Tamanhos são os bytes reais informados pelos servidores, salvo
onde está escrito "estimado".

Rota aprovada (23/10/2026, 19h43): FLUX.2 klein 4B → `rembg` + BiRefNet → TripoSG sem `diso` → Blender, no Windows,
sem admin. D8 com uma IA só (TripoSG).

Raiz de tudo: `C:\Users\davir\drf-ia3d\` (ASCII, fora do repo). Cache do Hugging Face apontado para lá:
`HF_HOME=C:\Users\davir\drf-ia3d\hf-cache`. Cache do `uv`: `UV_CACHE_DIR=C:\Users\davir\drf-ia3d\uv-cache`.

## 1. Pesos (modelos)

### 1.1 FLUX.2 klein 4B — imagem de conceito
- Repo: <https://huggingface.co/black-forest-labs/FLUX.2-klein-4B> · revisão `e7b7dc27f91deacad38e78976d1f2b499d76a294`
- Licença: **Apache 2.0** (model card + `LICENSE.md`). Não é gated.
- Baixar **só o layout diffusers** (`allow_patterns`), **sem** o `flux-2-klein-4b.safetensors` de arquivo único
  (7,75 GB duplicados) e sem as imagens de exemplo:

| Arquivo | GB |
| --- | --- |
| `transformer/diffusion_pytorch_model.safetensors` | 7,7511 |
| `text_encoder/model-00001-of-00002.safetensors` | 4,9672 |
| `text_encoder/model-00002-of-00002.safetensors` | 3,0778 |
| `vae/diffusion_pytorch_model.safetensors` | 0,1681 |
| `tokenizer/*` (7 arquivos) | 0,0159 |
| `model_index.json`, `scheduler/*`, `*/config.json`, `text_encoder/model.safetensors.index.json`, `text_encoder/generation_config.json`, `LICENSE.md` | < 0,001 |
| **Subtotal** | **15,98** |

### 1.2 TripoSG — forma
- Pesos: <https://huggingface.co/VAST-AI/TripoSG> · revisão `2c1c516d22d58db486a058d98d31bb6177344e06` · **MIT**

| Arquivo | GB |
| --- | --- |
| `transformer/diffusion_pytorch_model.safetensors` | 5,7583 |
| `image_encoder_dinov2/model.safetensors` | 1,2175 |
| `vae/diffusion_pytorch_model.safetensors` | 0,9707 |
| `model_index.json`, `scheduler/*`, `*/config.json`, `feature_extractor_dinov2/preprocessor_config.json` | < 0,001 |
| **Subtotal** | **7,95** |

- **Não baixar** `briaai/RMBG-1.4` (licença Bria, não comercial): a entrada será PNG já recortado (alpha válido), e
  com alpha válido o `load_image` do TripoSG não chama o removedor.
- Código: `git clone https://github.com/VAST-AI-Research/TripoSG` e `git checkout fc5c40990181e2a756c4e0b1c2f4d6b5202faf8c`
  (main de 18/04/2025) · MIT · < 0,05 GB (estimado).

### 1.3 Removedor de fundo (`rembg`)
- Principal: **BiRefNet-general** (MIT) — `https://github.com/danielgatis/rembg/releases/download/v0.0.0/BiRefNet-general-epoch_244.onnx`
  · 0,973 GB · md5 `7a35a0141cbbc80de11d9c9a28f52697` (o `rembg` confere).
- Reserva (opcional): **u2net** (Apache 2.0) — `https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net.onnx` · 0,176 GB.
- **Nunca** usar a sessão `bria-rmbg` do `rembg`.
- Destino: `U2NET_HOME=C:\Users\davir\drf-ia3d\rembg-models`.

### 1.4 Blender
- **Já instalado** (Blender 5.2 em `C:\Program Files\Blender Foundation`). Nada a baixar.

## 2. Ambientes Python (via `uv`, sem admin)

| Ambiente | Pasta | Python | Pacotes principais (versão fixa) | Download | Instalado |
| --- | --- | --- | --- | --- | --- |
| `flux` | `drf-ia3d\envs\flux` | 3.12 (já instalado pelo `uv`) | `torch==2.14.1+cu126` (wheel Windows cp312: **2,60 GB**), `diffusers==0.42.0` (já traz `pipeline_flux2_klein.py`; não precisa do git), `transformers`, `accelerate`, `safetensors`, `rembg==2.0.86` (MIT), `onnxruntime==1.31.0` (CPU; basta para recorte) | ~3,2 GB (estimado) | ~6–7 GB (estimado) |
| `triposg` | `drf-ia3d\envs\triposg` | 3.10 (já instalado pelo `uv`; o TripoSG fixa `numpy==1.22.3`) | `torch==2.5.1+cu124` (wheel Windows cp310: **2,51 GB**), `requirements.txt` do TripoSG **sem** `diso` (`diffusers`, `transformers`, `einops`, `huggingface_hub`, `opencv-python`, `trimesh`, `omegaconf`, `scikit-image`, `numpy==1.22.3`, `peft`, `jaxtyping`, `typeguard`, `pymeshlab`) | ~3,0 GB (estimado) | ~6 GB (estimado) |

Os dois `torch` trazem o runtime CUDA dentro do wheel: **não precisa de CUDA Toolkit, `nvcc` nem Visual Studio**.
Driver atual (610.88) atende cu124 e cu126.

## 3. Patch do TripoSG (fora do repo, na cópia em `drf-ia3d\TripoSG`)

Move o import do `diso` (CC BY-NC 4.0) para dentro do único lugar que o usa — o decodificador "flash", que nunca vamos
chamar. Sem isso, `import triposg` falha porque o `diso` não estará instalado.

```diff
--- a/triposg/inference_utils.py
+++ b/triposg/inference_utils.py
@@ -4,7 +4,6 @@ import torch.nn as nn
 import scipy.ndimage
 from skimage import measure
 from einops import repeat
-from diso import DiffDMC
 import torch.nn.functional as F
 
 from triposg.utils.typing import *
@@ -463,6 +462,7 @@ def flash_extract_geometry(
     grid_logits = grid_logits[0]
     try:
         print("final grids shape = ", grid_logits.shape)
+        from diso import DiffDMC  # diso (CC BY-NC 4.0) is not installed; this flash path is never used
         dmc = DiffDMC(dtype=torch.float32).to(grid_logits.device)
         sdf = -grid_logits / octree_resolution
         sdf = sdf.to(torch.float32).contiguous()
```
(É "uma linha" movida: uma remoção e uma inserção.) Linhas conferidas no commit `fc5c409`.

Uso sem `diso` e sem Bria: um script nosso (em `drf-ia3d\scripts\`, fora do repo) chamando
`TripoSGPipeline(...)(image=..., use_flash_decoder=False, ...)`, com o PNG já recortado. O `scripts/inference_triposg.py`
original **não** será usado como está, porque carrega o RMBG-1.4 na inicialização.

## 4. Total e espaço

| Item | GB |
| --- | --- |
| Pesos FLUX.2 klein 4B | 15,98 |
| Pesos TripoSG + código | 7,99 |
| BiRefNet + u2net | 1,15 |
| Ambientes Python instalados (estimado) | 12–13 |
| Cache de download do `uv` (estimado; apagável com `uv cache clean`) | ~6 |
| **Pico total (estimado)** | **~44** |
| Depois de limpar o cache | ~38 |

C: hoje: **129 GB livres** (medido agora; eram 133–134 GB na manhã de 23/10). Depois da instalação: **~85 GB livres**
no pico e ~91 GB depois de limpar o cache → acima do piso de **60 GB** ✓.

## 5. Ordem proposta (depois do ok)
1. Criar `drf-ia3d\` e as variáveis `HF_HOME`, `UV_CACHE_DIR`, `U2NET_HOME` (só na sessão, sem mexer no sistema).
2. Ambiente `flux` + pesos FLUX → gerar 1 conceito do handgrip e **medir** tempo/VRAM (hoje é só estimativa).
3. `rembg` BiRefNet → PNG recortado.
4. Ambiente `triposg` + clone + patch + pesos → 1 malha; medir tempo/VRAM do caminho sem "flash".
5. Blender: limpeza, escala, UV; exportar GLB. Registrar tudo em `ASSETS.md` (origem, licença, prompt, hash).

## Riscos que continuam abertos
- Tempo do FLUX na 3060 e do TripoSG sem "flash": **não medidos**.
- `torch 2.14.1` × `diffusers 0.42.0`: compatibilidade conferida só por versão, não executada.
- RAM do PC: 31,9 GB (32 GB nominais), no limite do recomendado para o offload do FLUX: fechar navegador/IDE pesados ao gerar.

Aprovação do Davi: pendente.
