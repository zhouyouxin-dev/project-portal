import {
  BrainCircuit,
  Briefcase,
  ChartColumn,
  CodeXml,
  Cpu,
  Radio,
  Sparkles,
  type LucideProps,
} from "lucide-react"

type IconComponent = React.ComponentType<LucideProps>

/** 赛道图标。与 types/index.ts 的 PROJECT_TYPES 一一对应，未知赛道兜底 Sparkles */
const TYPE_ICONS: Record<string, IconComponent> = {
  ai: BrainCircuit,
  software: CodeXml,
  hardware: Cpu,
  iot: Radio,
  bigdata: ChartColumn,
  business: Briefcase,
  other: Sparkles,
}

interface TypeIconProps extends LucideProps {
  type: string
}

export function TypeIcon({ type, ...props }: TypeIconProps) {
  const Icon = TYPE_ICONS[type] ?? Sparkles
  return <Icon aria-hidden {...props} />
}
