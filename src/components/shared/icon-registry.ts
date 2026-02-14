import {
  MessageSquareText,
  Sparkles,
  Languages,
  Group,
  FileText,
  ScanEye,
  BookOpen,
  SpellCheck,
  CloudSun,
  Shrink,
  ImageIcon,
  UserRoundPen,
  UserRound,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

/** Map icon name strings (from backend) to lucide React components. */
const iconRegistry: Record<string, LucideIcon> = {
  MessageSquareText,
  Sparkles,
  Languages,
  Group,
  FileText,
  ScanEye,
  BookOpen,
  SpellCheck,
  CloudSun,
  Shrink,
  ImageIcon,
  UserRoundPen,
  UserRound,
  HelpCircle,
};

export function resolveIcon(name: string): LucideIcon | undefined {
  return iconRegistry[name];
}
