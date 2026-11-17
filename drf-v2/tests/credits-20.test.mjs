// Fila 20: crédito dos modelos 3D e nota de não vínculo, PT/EN, no rodapé do Recruiter Mode.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { uiLabels } from '../src/features/uiLabels.ts'

test('credits and disclaimer exist in both locales', () => {
  const pt = uiLabels('pt'), en = uiLabels('en')
  assert.match(pt.credits3d, /IA \(FLUX\.2 klein, TripoSG\).*Blender/)
  assert.match(en.credits3d, /AI \(FLUX\.2 klein, TripoSG\).*Blender/)
  assert.match(pt.disclaimer, /Sem vínculo com a F1, a FIA ou equipes/)
  assert.match(en.disclaimer, /No affiliation with F1, the FIA or any team/)
})

test('recruiter footer renders the credits line', async () => {
  const src = await readFile(new URL('../src/features/RecruiterView.tsx', import.meta.url), 'utf8')
  assert.match(src, /<footer className="drf-footer">[\s\S]*drf-footer-credits[\s\S]*t\.credits3d[\s\S]*t\.disclaimer[\s\S]*<\/footer>/)
})
