/**
 * Copy text to the clipboard, with a fallback for insecure contexts.
 *
 * `navigator.clipboard` only exists in secure contexts (HTTPS or localhost).
 * On plain HTTP — e.g. a fresh deployment on http://<server-ip>:3000 before
 * TLS is set up — it is `undefined` and `writeText` throws a TypeError,
 * which made the "Copy link" / "Copy code" buttons fail. The legacy
 * `document.execCommand('copy')` path below still works there.
 */
export async function copyText(text: string): Promise<boolean> {
  if (typeof window !== 'undefined' && window.isSecureContext && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Permission denied / other error — fall through to the legacy path.
    }
  }

  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.top = '0'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)

    // Preserve the user's current selection.
    const selection = document.getSelection()
    const saved = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null

    ta.select()
    ta.setSelectionRange(0, text.length) // required on iOS Safari

    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch {
      ok = false
    }
    ta.remove()

    if (saved && selection) {
      selection.removeAllRanges()
      selection.addRange(saved)
    }
    return ok
  } catch {
    return false
  }
}
