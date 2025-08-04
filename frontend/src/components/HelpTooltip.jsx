import { HelpCircle } from "lucide-react";
import { useState } from "react";

export function HelpTooltip({ content, title }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="text-slate-400 hover:text-blue-400 transition-colors"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 shadow-xl z-50 w-64 rounded-xl">
          {title && <h4 className="text-white font-medium mb-1">{title}</h4>}
          <p className="text-slate-300 text-sm">{content}</p>
        </div>
      )}
    </div>
  );
}
