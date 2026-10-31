import type { CodeLang } from '../data/types.ts'

export type TokenKind = 'keyword' | 'string' | 'number' | 'comment' | 'plain'
export type Token = { text: string; kind: TokenKind }

const KEYWORDS: Record<CodeLang, string[]> = {
  cpp: ['void', 'int', 'long', 'float', 'char', 'bool', 'const', 'if', 'else', 'while', 'for', 'return', 'true', 'false', 'HIGH', 'LOW', 'INPUT', 'OUTPUT', 'INPUT_PULLUP', 'LED_BUILTIN'],
  python: ['from', 'import', 'as', 'def', 'while', 'if', 'else', 'not', 'with', 'continue', 'return', 'True', 'False', 'None'],
  bash: ['sudo', 'apt', 'mkdir', 'mount', 'systemctl', 'kodi', 'lsblk', 'pinout', 'vcgencmd', 'hostname', 'free', 'reboot', 'smbpasswd'],
}

const COMMENT: Record<CodeLang, string> = {
  cpp: '//[^\\n]*',
  python: '#[^\\n]*',
  bash: '#[^\\n]*',
}

function pattern(lang: CodeLang): RegExp {
  const words = KEYWORDS[lang].join('|')
  const preprocessor = lang === 'cpp' ? '|(#include[^\\n]*)' : '|(\\b\\B)'
  const longString = lang === 'python' ? '"""[\\s\\S]*?"""|' : ''
  return new RegExp(
    `(${COMMENT[lang]})|(${longString}"[^"\\n]*"|'[^'\\n]*')|\\b(${words})\\b${preprocessor}|\\b(0x[0-9A-Fa-f]+|\\d+(?:\\.\\d+)?)\\b`,
    'g',
  )
}

/** Splits source into lines of coloured tokens. Small on purpose: it only needs to cover the code in these lessons. */
export function highlight(source: string, lang: CodeLang): Token[][] {
  const tokens: Token[] = []
  const regex = pattern(lang)
  let last = 0
  for (const match of source.matchAll(regex)) {
    const index = match.index
    if (index > last) tokens.push({ text: source.slice(last, index), kind: 'plain' })
    const kind: TokenKind = match[1] ? 'comment' : match[2] ? 'string' : match[3] || match[4] ? 'keyword' : 'number'
    tokens.push({ text: match[0], kind })
    last = index + match[0].length
  }
  if (last < source.length) tokens.push({ text: source.slice(last), kind: 'plain' })

  const lines: Token[][] = [[]]
  for (const token of tokens) {
    token.text.split('\n').forEach((part, i) => {
      if (i > 0) lines.push([])
      if (part) lines[lines.length - 1].push({ text: part, kind: token.kind })
    })
  }
  return lines
}
