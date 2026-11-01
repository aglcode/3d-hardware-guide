import { useEffect, useRef } from 'react'
import { SHORTCUT_GROUPS } from '../data/shortcuts.ts'

/** A modal alert dialog: it holds focus, and only its button or Escape closes it. */
export function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const element = dialog.current
    if (element && !element.open) element.showModal()
    closeButton.current?.focus()
  }, [])

  return (
    <dialog
      ref={dialog}
      role="alertdialog"
      aria-labelledby="shortcuts-title"
      aria-describedby="shortcuts-description"
      onClose={onClose}
      className="m-auto max-h-[calc(100dvh-32px)] w-[calc(100vw-32px)] max-w-[520px] overflow-y-auto rounded-sheet border border-line bg-surface p-6 text-ink shadow-xl backdrop:bg-black/50"
    >
      <h2 id="shortcuts-title" className="text-title font-semibold tracking-[-0.01em]">
        Keyboard shortcuts
      </h2>
      <p id="shortcuts-description" className="mt-1 text-muted">
        Space runs the program unless a button or link has focus.
      </p>

      <div className="mt-5 flex flex-col gap-5">
        {SHORTCUT_GROUPS.map((group) => (
          <section key={group.title}>
            <h3 className="mb-1 font-semibold">{group.title}</h3>
            <dl>
              {group.shortcuts.map((shortcut) => (
                <div key={shortcut.action} className="flex min-h-9 items-center justify-between gap-4 border-t border-rule py-1">
                  <dt>{shortcut.label}</dt>
                  <dd className="flex shrink-0 gap-1">
                    {shortcut.keys.map((key) => (
                      <kbd key={key} className="grid h-6 min-w-6 place-items-center rounded-control border border-control bg-raised px-1.5 font-sans text-small font-medium">
                        {key}
                      </kbd>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          ref={closeButton}
          type="button"
          onClick={() => dialog.current?.close()}
          className="h-9 rounded-control bg-ink px-4 font-medium text-surface transition-opacity hover:opacity-85 active:opacity-70"
        >
          Close
        </button>
      </div>
    </dialog>
  )
}
