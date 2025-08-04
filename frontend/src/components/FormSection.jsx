export function FormSection({
  title,
  description,
  icon,
  children,
  className,
  completed = false,
}) {
  return (
    <div
      className={`
        p-6 bg-slate-800/40 backdrop-blur-xl border border-slate-700/30 transition-all duration-300 rounded-xl
        ${completed && "border-green-500/30 bg-green-500/5"}
        ${className}
      `}
    >
      <div className="flex items-center space-x-3 mb-4">
        <div
          className={`
            w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
            ${completed ? "bg-green-500/20 text-green-400" : "bg-gradient-to-br from-blue-500 to-cyan-400 text-white"}
          `}
        >
          <icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-lg">{title}</h3>
          {description && (
            <p className="text-slate-400 text-sm">{description}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
