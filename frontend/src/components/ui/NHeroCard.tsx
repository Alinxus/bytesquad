import React from 'react';
import { cn } from "@/lib/utils";
import { NCowrieMark } from "./NCowrieMark";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface NHeroCardProps {
  balance: string;
  earned: string;
  pending: string;
  className?: string;
}

export const NHeroCard: React.FC<NHeroCardProps> = ({ 
  balance, 
  earned, 
  pending, 
  className 
}) => {
  return (
    <div className={cn(
      "relative overflow-hidden bg-navy text-white p-8 rounded-[2rem] shadow-2xl border border-navy-border group transition-all hover:shadow-primary/10",
      className
    )}>
      {}
      <NCowrieMark 
        className="absolute -bottom-4 -right-4 w-48 h-24 text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-700" 
      />
      
      <div className="relative z-10 space-y-6">
        <div>
          <p className="font-sans text-[11px] font-bold text-ink-hint uppercase tracking-[0.2em] mb-1">
            Total Balance
          </p>
          <h2 className="font-display text-5xl font-bold tracking-[-0.03em]">
            {balance}
          </h2>
        </div>

        <div className="flex items-center gap-8 pt-4 border-t border-navy-border/50">
          <div className="space-y-1">
            <p className="font-sans text-[10px] font-bold text-ink-hint uppercase tracking-wider">
              Earned
            </p>
            <div className="flex items-center gap-1.5 text-success font-display font-bold">
              <ArrowUpRight className="w-4 h-4" />
              <span>{earned}</span>
            </div>
          </div>

          <div className="w-px h-8 bg-navy-border/50" />

          <div className="space-y-1">
            <p className="font-sans text-[10px] font-bold text-ink-hint uppercase tracking-wider">
              Pending
            </p>
            <div className="flex items-center gap-1.5 text-gold font-display font-bold">
              <ArrowDownRight className="w-4 h-4" />
              <span>{pending}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
