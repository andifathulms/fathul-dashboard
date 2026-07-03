import { cn } from '@/lib/utils'

/** The fathul-dashboard mark. Uses the rasterized PNG so it matches the favicon
 *  exactly (the pre-rounded gradient tile with the mono "f_"). */
export default function Logo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      width={size}
      height={size}
      alt="fathul-dashboard"
      className={cn('shrink-0', className)}
    />
  )
}
