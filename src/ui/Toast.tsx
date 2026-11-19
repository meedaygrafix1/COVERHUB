import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { CircleAlert, CircleCheck } from 'lucide-react'
import { typeClass } from '@/lib/type-scale'
import { cn } from '@/lib/utils'

type Kind = 'success' | 'error'
interface Toast {
  id: number
  text: string
  kind: Kind
}

const Ctx = createContext<(text: string, kind?: Kind) => void>(() => {})

export const useToast = () => useContext(Ctx)

/** Inverted surface toasts, like the tooltip bubble: foreground fill, background text. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const n = useRef(0)
  const push = useCallback((text: string, kind: Kind = 'success') => {
    const id = ++n.current
    setToasts((t) => [...t.slice(-2), { id, text, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600)
  }, [])
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-16 left-1/2 z-[80] flex -translate-x-1/2 flex-col items-center gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={cn('anim-toast flex items-center gap-2 rounded-[10px] bg-foreground py-2 pr-3.5 pl-3 text-background shadow-lg', typeClass('body'))}>
            {t.kind === 'success' ? <CircleCheck size={15} className="text-[#4ADE80]" /> : <CircleAlert size={15} className="text-[#FBBF24]" />}
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
