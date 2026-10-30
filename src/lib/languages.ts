export interface LanguageInfo {
  /** Shiki / grammar id used for highlighting */
  id: string
  /** Human-readable label */
  label: string
  /** GitHub Linguist style color dot */
  color: string
}

const EXT_MAP: Record<string, LanguageInfo> = {
  ts: { id: 'typescript', label: 'TypeScript', color: '#3178c6' },
  mts: { id: 'typescript', label: 'TypeScript', color: '#3178c6' },
  tsx: { id: 'tsx', label: 'TSX', color: '#3178c6' },
  js: { id: 'javascript', label: 'JavaScript', color: '#f1e05a' },
  mjs: { id: 'javascript', label: 'JavaScript', color: '#f1e05a' },
  cjs: { id: 'javascript', label: 'JavaScript', color: '#f1e05a' },
  jsx: { id: 'jsx', label: 'JSX', color: '#f1e05a' },
  json: { id: 'json', label: 'JSON', color: '#cbcb41' },
  jsonc: { id: 'jsonc', label: 'JSONC', color: '#cbcb41' },
  md: { id: 'markdown', label: 'Markdown', color: '#083fa1' },
  mdx: { id: 'mdx', label: 'MDX', color: '#fcb32c' },
  py: { id: 'python', label: 'Python', color: '#3572A5' },
  pyi: { id: 'python', label: 'Python', color: '#3572A5' },
  rb: { id: 'ruby', label: 'Ruby', color: '#701516' },
  go: { id: 'go', label: 'Go', color: '#00ADD8' },
  rs: { id: 'rust', label: 'Rust', color: '#dea584' },
  java: { id: 'java', label: 'Java', color: '#b07219' },
  kt: { id: 'kotlin', label: 'Kotlin', color: '#A97BFF' },
  kts: { id: 'kotlin', label: 'Kotlin', color: '#A97BFF' },
  c: { id: 'c', label: 'C', color: '#555555' },
  h: { id: 'c', label: 'C header', color: '#555555' },
  cpp: { id: 'cpp', label: 'C++', color: '#f34b7d' },
  cc: { id: 'cpp', label: 'C++', color: '#f34b7d' },
  cxx: { id: 'cpp', label: 'C++', color: '#f34b7d' },
  hpp: { id: 'cpp', label: 'C++ header', color: '#f34b7d' },
  cs: { id: 'csharp', label: 'C#', color: '#178600' },
  php: { id: 'php', label: 'PHP', color: '#4F5D95' },
  swift: { id: 'swift', label: 'Swift', color: '#F05138' },
  sh: { id: 'shellscript', label: 'Shell', color: '#89e051' },
  bash: { id: 'shellscript', label: 'Bash', color: '#89e051' },
  zsh: { id: 'shellscript', label: 'Zsh', color: '#89e051' },
  sql: { id: 'sql', label: 'SQL', color: '#e38c00' },
  html: { id: 'html', label: 'HTML', color: '#e34c26' },
  htm: { id: 'html', label: 'HTML', color: '#e34c26' },
  xml: { id: 'xml', label: 'XML', color: '#0060ac' },
  svg: { id: 'xml', label: 'SVG', color: '#ffb13b' },
  css: { id: 'css', label: 'CSS', color: '#663399' },
  scss: { id: 'scss', label: 'SCSS', color: '#c6538c' },
  sass: { id: 'sass', label: 'Sass', color: '#a53b70' },
  less: { id: 'less', label: 'Less', color: '#1d365d' },
  vue: { id: 'vue', label: 'Vue', color: '#41b883' },
  svelte: { id: 'svelte', label: 'Svelte', color: '#ff3e00' },
  yaml: { id: 'yaml', label: 'YAML', color: '#cb171e' },
  yml: { id: 'yaml', label: 'YAML', color: '#cb171e' },
  toml: { id: 'toml', label: 'TOML', color: '#9c4221' },
  ini: { id: 'ini', label: 'INI', color: '#d1dbe0' },
  conf: { id: 'ini', label: 'Config', color: '#d1dbe0' },
  env: { id: 'ini', label: 'Dotenv', color: '#cdb4db' },
  lua: { id: 'lua', label: 'Lua', color: '#000080' },
  pl: { id: 'perl', label: 'Perl', color: '#0298c3' },
  r: { id: 'r', label: 'R', color: '#198CE7' },
  dart: { id: 'dart', label: 'Dart', color: '#00B4AB' },
  ex: { id: 'elixir', label: 'Elixir', color: '#6e4a7e' },
  hs: { id: 'haskell', label: 'Haskell', color: '#5e5086' },
  scala: { id: 'scala', label: 'Scala', color: '#c22d40' },
  graphql: { id: 'graphql', label: 'GraphQL', color: '#e10098' },
  gql: { id: 'graphql', label: 'GraphQL', color: '#e10098' },
  dockerfile: { id: 'dockerfile', label: 'Dockerfile', color: '#384d54' },
  makefile: { id: 'makefile', label: 'Makefile', color: '#427819' },
  diff: { id: 'diff', label: 'Diff', color: '#88146d' },
  patch: { id: 'diff', label: 'Patch', color: '#88169d' },
  txt: { id: 'text', label: 'Text', color: '#9aa4b2' },
  log: { id: 'text', label: 'Log', color: '#9aa4b2' },
}

const NAME_MAP: Record<string, LanguageInfo> = {
  dockerfile: EXT_MAP.dockerfile,
  makefile: EXT_MAP.makefile,
  '.env': EXT_MAP.env,
  '.gitignore': { id: 'text', label: 'Ignore file', color: '#9aa4b2' },
  license: { id: 'text', label: 'License', color: '#9aa4b2' },
}

export const TEXT_LANGUAGE: LanguageInfo = { id: 'text', label: 'Plain text', color: '#9aa4b2' }

export function detectLanguage(filename: string): LanguageInfo {
  const base = (filename || '').trim().toLowerCase()
  if (!base) return TEXT_LANGUAGE
  const byName = NAME_MAP[base]
  if (byName) return byName
  const dot = base.lastIndexOf('.')
  if (dot === -1) return TEXT_LANGUAGE
  const ext = base.slice(dot + 1)
  return EXT_MAP[ext] ?? TEXT_LANGUAGE
}

/** Format bytes as a short human string. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
