import type {Metadata} from 'next';
import './globals.css';
import { AppLayout } from '@/components/AppLayout';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'GATE CS Planner',
  description: 'A comprehensive study planner for GATE Computer Science aspirants.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={cn("h-full", "font-sans", geist.variable)}>
      <body className="h-full overflow-hidden text-slate-800" suppressHydrationWarning>
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}
